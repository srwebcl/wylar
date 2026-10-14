'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { quoteSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { changeLeadStatus } from '@/actions/leads';

export interface QuoteFormState {
    error?: string;
    success?: string;
}

/** Genera el código visible de la cotización, ej. "COT-0001", a partir del
 * id autoincremental (mismo patrón en dos pasos que usan leads/certificados). */
async function assignQuoteCode(quoteId: number): Promise<string> {
    const code = `COT-${String(quoteId).padStart(4, '0')}`;
    await prisma.quote.update({ where: { id: quoteId }, data: { code } });
    return code;
}

/**
 * Nueva cotización para una oportunidad. Si ya existía una cotización no
 * terminal (BORRADOR/ENVIADA) para esa oportunidad, queda marcada
 * REEMPLAZADA — las versiones anteriores nunca se sobrescriben, solo
 * cambian de estado (ver regla de negocio del usuario).
 */
export async function createQuote(_prevState: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
    const user = await requireUser();

    let items: unknown;
    try {
        items = JSON.parse(String(formData.get('items') || '[]'));
    } catch {
        return { error: 'Los ítems de la cotización no son válidos.' };
    }

    const parsed = quoteSchema.safeParse({
        opportunityId: formData.get('opportunityId'),
        notes: formData.get('notes') || null,
        items,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos de la cotización.' };
    const data = parsed.data;

    const opportunity = await prisma.lead.findUnique({ where: { id: data.opportunityId } });
    if (!opportunity) return { error: 'La oportunidad no existe.' };

    const previousOpen = await prisma.quote.findMany({
        where: { opportunityId: data.opportunityId, status: { in: ['BORRADOR', 'ENVIADA'] } },
    });
    const nextVersion = (await prisma.quote.count({ where: { opportunityId: data.opportunityId } })) + 1;

    const itemsWithSubtotal = data.items.map((item) => ({ ...item, subtotal: item.quantity * item.unitPrice }));
    const total = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);

    const quote = await prisma.quote.create({
        data: {
            code: `TEMP-${Date.now()}`,
            opportunityId: data.opportunityId,
            version: nextVersion,
            status: 'ENVIADA',
            notes: data.notes || null,
            total,
            createdById: user.id,
            items: {
                create: itemsWithSubtotal.map((item) => ({
                    productId: item.productId || null,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                })),
            },
        },
    });
    const code = await assignQuoteCode(quote.id);

    if (previousOpen.length > 0) {
        await prisma.quote.updateMany({ where: { id: { in: previousOpen.map((q) => q.id) } }, data: { status: 'REEMPLAZADA' } });
    }

    await prisma.leadActivity.create({
        data: {
            leadId: data.opportunityId,
            userId: user.id,
            authorName: user.name,
            type: 'NOTA',
            text: `Cotización ${code} (v${nextVersion}) creada por ${user.name}. Total: $${total.toLocaleString('es-CL')}.`,
        },
    });

    await audit(user, 'COTIZACION_CREADA', 'cotizacion', code, `oportunidad ${opportunity.code}`);
    revalidatePath(`/leads/${data.opportunityId}`);
    return { success: `Cotización ${code} creada.` };
}

/**
 * Marca una cotización como aceptada: las demás no-terminales de la misma
 * oportunidad quedan REEMPLAZADAS, y la oportunidad pasa a CERRADO (Ganada)
 * — regla explícita del usuario: "la oportunidad debe marcarse como ganada
 * cuando el cliente acepte y confirme la compra".
 */
export async function markQuoteAccepted(quoteId: number): Promise<QuoteFormState> {
    const user = await requireUser();

    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) return { error: 'La cotización no existe.' };

    await prisma.quote.update({ where: { id: quoteId }, data: { status: 'ACEPTADA' } });
    await prisma.quote.updateMany({
        where: { opportunityId: quote.opportunityId, id: { not: quoteId }, status: { in: ['BORRADOR', 'ENVIADA'] } },
        data: { status: 'REEMPLAZADA' },
    });

    await prisma.leadActivity.create({
        data: {
            leadId: quote.opportunityId,
            userId: user.id,
            authorName: user.name,
            type: 'NOTA',
            text: `Cotización ${quote.code} marcada como aceptada por ${user.name}.`,
        },
    });

    await changeLeadStatus(quote.opportunityId, 'CERRADO');
    await audit(user, 'COTIZACION_ACEPTADA', 'cotizacion', quote.code);
    revalidatePath(`/leads/${quote.opportunityId}`);
    return { success: `Cotización ${quote.code} marcada como aceptada. La oportunidad pasó a Cerrado.` };
}

export async function markQuoteRejected(quoteId: number): Promise<QuoteFormState> {
    const user = await requireUser();

    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) return { error: 'La cotización no existe.' };

    await prisma.quote.update({ where: { id: quoteId }, data: { status: 'RECHAZADA' } });
    await audit(user, 'COTIZACION_RECHAZADA', 'cotizacion', quote.code);
    revalidatePath(`/leads/${quote.opportunityId}`);
    return { success: `Cotización ${quote.code} marcada como rechazada.` };
}
