import 'server-only';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { publicLeadSchema } from '@/lib/validation';
import { SYSTEM_ACTIVITY_TYPES } from '@/lib/constants';
import { resolveSource } from '@/lib/leadSource';

/**
 * Módulo de Captura de Oportunidades: crea un lead a partir del formulario
 * público de wylar.cl. Se usa desde app/api/public/leads/route.ts. Vive fuera
 * de src/actions porque los archivos 'use server' exponen cada función exportada
 * como endpoint POST directo.
 */
export async function createLeadFromPublicForm(input: unknown, refererHeader: string | null) {
    const parsed = publicLeadSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    // Honeypot: si el campo trampa viene con contenido, es un bot — se
    // responde éxito igualmente para no delatar el filtro.
    if (parsed.data.website) {
        return { ok: true as const, id: 0, code: 'IGNORADO' };
    }

    const { website: _website, ...data } = parsed.data;
    const source = resolveSource(data.source, refererHeader);

    const lead = await prisma.lead.create({
        data: {
            code: `TEMP-${randomUUID()}`,
            type: data.type,
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company || null,
            certificationInterest: data.certificationInterest || null,
            message: data.message || null,
            source,
            sourceDetail: data.sourceDetail || refererHeader || null,
            status: 'NUEVO',
        },
    });

    // El código de referencia se deriva del id autoincremental, solo
    // disponible después del insert.
    const code = `LEAD-${1000 + lead.id}`;
    await prisma.lead.update({ where: { id: lead.id }, data: { code } });

    await prisma.leadActivity.create({
        data: {
            leadId: lead.id,
            userId: null,
            authorName: 'Sistema',
            type: SYSTEM_ACTIVITY_TYPES.CREACION,
            text: `Prospecto ingresado automáticamente desde el sitio web (canal: ${source}).`,
        },
    });

    revalidatePath('/');
    revalidatePath('/leads');
    return { ok: true as const, id: lead.id, code };
}

