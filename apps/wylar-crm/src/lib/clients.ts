import 'server-only';
import { prisma } from '@/lib/prisma';

/**
 * Busca un Cliente existente por RUT (si trae) o por correo+nombre (si no
 * trae RUT) y lo reutiliza; si no existe, lo crea. Así ningún alta nueva de
 * oportunidad duplica un cliente que ya existe — mismo criterio de
 * identidad que usa el backfill histórico (ver migración
 * lead_client_product_not_null).
 */
export async function findOrCreateClient(input: {
    type: string;
    name: string;
    rut: string;
    rutNorm: string;
    email: string;
    phone: string;
    company?: string | null;
}) {
    const existing = input.rutNorm
        ? await prisma.client.findFirst({ where: { rutNorm: input.rutNorm } })
        : await prisma.client.findFirst({ where: { email: input.email, name: input.name } });

    if (existing) return existing;

    return prisma.client.create({
        data: {
            type: input.type,
            name: input.name,
            rut: input.rut,
            rutNorm: input.rutNorm,
            email: input.email,
            phone: input.phone,
            company: input.company || null,
        },
    });
}

/**
 * Bitácora unificada de un cliente: las gestiones de TODAS sus
 * oportunidades, ordenadas por fecha, cada una etiquetada con a qué
 * oportunidad corresponde. No es una tabla nueva — es una consulta sobre
 * LeadActivity a través de Lead.clientId (ver regla de negocio del usuario:
 * "la bitácora no es otra tabla, es una pantalla o consulta").
 */
export async function getClientActivityFeed(clientId: number) {
    return prisma.leadActivity.findMany({
        where: { lead: { clientId } },
        include: { lead: { select: { id: true, code: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
