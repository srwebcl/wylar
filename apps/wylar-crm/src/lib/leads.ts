import 'server-only';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { publicLeadSchema } from '@/lib/validation';
import { SYSTEM_ACTIVITY_TYPES } from '@/lib/constants';
import { resolveSource } from '@/lib/leadSource';
import { sendLeadNotificationEmail, sendLeadConfirmationEmail } from '@/lib/email';
import { normalizeRut } from '@/lib/rut';
import { formatChileanMobile } from '@/lib/phone';
import { findOrCreateClient } from '@/lib/clients';

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

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product || !product.active) {
        return { ok: false as const, error: 'El producto o servicio seleccionado no está disponible.' };
    }

    const rutNorm = normalizeRut(data.rut);
    const normalizedName = data.name.trim().toUpperCase();
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedPhone = formatChileanMobile(data.phone) ?? data.phone;
    const normalizedCompany = data.company ? data.company.trim().toUpperCase() : null;
    const normalizedComuna = data.comuna ? data.comuna.trim() : null;

    const client = await findOrCreateClient({
        type: data.type,
        name: normalizedName,
        rut: data.rut,
        rutNorm,
        email: normalizedEmail,
        phone: normalizedPhone,
        company: normalizedCompany,
    });

    const lead = await prisma.lead.create({
        data: {
            code: `TEMP-${randomUUID()}`,
            type: data.type,
            name: normalizedName,
            rut: data.rut,
            rutNorm,
            email: normalizedEmail,
            phone: normalizedPhone,
            company: normalizedCompany,
            clientId: client.id,
            productId: product.id,
            certificationInterest: product.name,
            comuna: normalizedComuna,
            message: data.message ? data.message.trim() : null,
            source,
            sourceDetail: data.sourceDetail || refererHeader || null,
            status: 'NUEVO',
        },
    });

    // El código de referencia se deriva del id autoincremental, solo
    // disponible después del insert.
    const code = `LEAD-${1000 + lead.id}`;
    const updatedLead = await prisma.lead.update({ where: { id: lead.id }, data: { code } });

    await prisma.leadActivity.create({
        data: {
            leadId: lead.id,
            userId: null,
            authorName: 'Sistema',
            type: SYSTEM_ACTIVITY_TYPES.CREACION,
            text: `Oportunidad ingresada automáticamente desde el sitio web (canal: ${source}).`,
        },
    });

    // Se espera (await) en vez de "disparar y olvidar": una función serverless
    // puede congelarse apenas se responde la petición, así que una promesa sin
    // esperar corre el riesgo de no llegar a completarse. Cada función atrapa
    // sus propios errores — un correo que falla nunca debe tumbar el alta del lead.
    await Promise.all([sendLeadNotificationEmail(updatedLead), sendLeadConfirmationEmail(updatedLead)]);

    revalidatePath('/');
    revalidatePath('/leads');
    return { ok: true as const, id: lead.id, code };
}

