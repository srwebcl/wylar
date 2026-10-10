import 'server-only';
import { prisma } from '@/lib/prisma';

/** Busca si un correo o teléfono está marcado como "no contactar". Devuelve
 * la entrada más reciente que calce, o null. Se usa al mostrar prospectos
 * (lista y ficha) para alertar aunque el prospecto sea nuevo y la marca
 * venga de un contacto anterior con esa misma persona. */
export async function checkDoNotContact(email: string, phone: string) {
    return prisma.doNotContactEntry.findFirst({
        where: { OR: [{ email }, { phone }] },
        orderBy: { createdAt: 'desc' },
    });
}

/** Trae las marcas para una lista de leads de una sola pasada (evita N+1).
 * Devuelve un Map keyed por "email|phone" con el motivo más reciente. */
export async function loadDoNotContactMap(contacts: { email: string; phone: string }[]) {
    const emails = [...new Set(contacts.map((c) => c.email).filter(Boolean))];
    const phones = [...new Set(contacts.map((c) => c.phone).filter(Boolean))];
    if (emails.length === 0 && phones.length === 0) return new Map<string, string>();

    const entries = await prisma.doNotContactEntry.findMany({
        where: { OR: [{ email: { in: emails } }, { phone: { in: phones } }] },
        orderBy: { createdAt: 'desc' },
    });

    const byEmail = new Map<string, string>();
    const byPhone = new Map<string, string>();
    for (const entry of entries) {
        if (entry.email && !byEmail.has(entry.email)) byEmail.set(entry.email, entry.reason);
        if (entry.phone && !byPhone.has(entry.phone)) byPhone.set(entry.phone, entry.reason);
    }

    const result = new Map<string, string>();
    for (const c of contacts) {
        const reason = byEmail.get(c.email) ?? byPhone.get(c.phone);
        if (reason) result.set(`${c.email}|${c.phone}`, reason);
    }
    return result;
}
