'use server';

import { revalidatePath } from 'next/cache';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { quoteSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { changeLeadStatus } from '@/actions/leads';
import { QuotePdf } from '@/components/QuotePdf';
import { sendQuotePdfEmail } from '@/lib/email';

export interface QuoteFormState {
    error?: string;
    success?: string;
    quoteId?: number;
    quoteCode?: string;
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
 * cambian de estado.
 */
export async function createQuote(_prevState: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
    const user = await requireUser();

    let items: unknown;
    try {
        items = JSON.parse(String(formData.get('items') || '[]'));
    } catch {
        return { error: 'Los ítems de la cotización no son válidos.' };
    }

    const initialStatus = formData.get('status') === 'BORRADOR' ? 'BORRADOR' : 'ENVIADA';

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
            status: initialStatus,
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
            text: `Cotización ${code} (v${nextVersion}) creada por ${user.name} con estado ${initialStatus}. Total: $${total.toLocaleString('es-CL')}.`,
        },
    });

    await audit(user, 'COTIZACION_CREADA', 'cotizacion', code, `oportunidad ${opportunity.code}`);

    revalidatePath('/cotizaciones');
    revalidatePath(`/leads/${data.opportunityId}`);
    return { success: `Cotización ${code} creada exitosamente.`, quoteId: quote.id, quoteCode: code };
}

/**
 * Envía una cotización en PDF adjunta al correo del cliente directamente
 * a través de Resend desde el CRM.
 */
export async function sendQuoteByEmail(
    quoteId: number,
    options?: { recipientEmail?: string; customMessage?: string },
): Promise<QuoteFormState> {
    const user = await requireUser();
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: {
            items: true,
            opportunity: true,
            createdBy: true,
        },
    });

    if (!quote) return { error: 'La cotización no existe.' };

    const recipient = options?.recipientEmail?.trim() || quote.opportunity.email;
    if (!recipient) return { error: 'No hay un correo de destinatario válido.' };

    const buffer = await renderToBuffer(
        QuotePdf({
            code: quote.code,
            version: quote.version,
            issueDate: quote.issueDate,
            notes: quote.notes,
            total: Number(quote.total),
            opportunity: {
                code: quote.opportunity.code,
                name: quote.opportunity.name,
                rut: quote.opportunity.rut,
                email: quote.opportunity.email,
                phone: quote.opportunity.phone,
                company: quote.opportunity.company,
                comuna: quote.opportunity.comuna,
            },
            items: quote.items.map((it) => ({
                id: it.id,
                description: it.description,
                quantity: it.quantity,
                unitPrice: Number(it.unitPrice),
                subtotal: Number(it.subtotal),
            })),
            executiveName: quote.createdBy?.name ?? user.name,
        }),
    );

    const emailResult = await sendQuotePdfEmail({
        recipientEmail: recipient,
        quoteCode: quote.code,
        clientName: quote.opportunity.name,
        totalAmount: Number(quote.total),
        itemsSummary: quote.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            subtotal: Number(it.subtotal),
        })),
        customMessage: options?.customMessage,
        pdfBuffer: buffer,
    });

    if (!emailResult.ok) {
        return { error: emailResult.error || 'No se pudo enviar el correo.' };
    }

    if (quote.status === 'BORRADOR') {
        await prisma.quote.update({
            where: { id: quoteId },
            data: { status: 'ENVIADA' },
        });
    }

    await prisma.leadActivity.create({
        data: {
            leadId: quote.opportunityId,
            userId: user.id,
            authorName: user.name,
            type: 'NOTA',
            text: `Cotización ${quote.code} enviada con PDF adjunto al correo ${recipient} por ${user.name}.`,
        },
    });

    await audit(user, 'COTIZACION_ENVIADA_EMAIL', 'cotizacion', quote.code, `a: ${recipient}`);

    revalidatePath('/cotizaciones');
    revalidatePath(`/cotizaciones/${quoteId}`);
    revalidatePath(`/leads/${quote.opportunityId}`);

    return { success: `Cotización ${quote.code} enviada con éxito a ${recipient}.` };
}

/**
 * Marca una cotización como aceptada: las demás no-terminales de la misma
 * oportunidad quedan REEMPLAZADAS, y la oportunidad pasa a CERRADO (Ganada).
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

    revalidatePath('/cotizaciones');
    revalidatePath(`/cotizaciones/${quoteId}`);
    revalidatePath(`/leads/${quote.opportunityId}`);
    return { success: `Cotización ${quote.code} marcada como aceptada. La oportunidad pasó a Cerrado.` };
}

export async function markQuoteRejected(quoteId: number): Promise<QuoteFormState> {
    const user = await requireUser();

    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) return { error: 'La cotización no existe.' };

    await prisma.quote.update({ where: { id: quoteId }, data: { status: 'RECHAZADA' } });

    await prisma.leadActivity.create({
        data: {
            leadId: quote.opportunityId,
            userId: user.id,
            authorName: user.name,
            type: 'NOTA',
            text: `Cotización ${quote.code} marcada como rechazada por ${user.name}.`,
        },
    });

    await audit(user, 'COTIZACION_RECHAZADA', 'cotizacion', quote.code);

    revalidatePath('/cotizaciones');
    revalidatePath(`/cotizaciones/${quoteId}`);
    revalidatePath(`/leads/${quote.opportunityId}`);
    return { success: `Cotización ${quote.code} marcada como rechazada.` };
}

export async function deleteQuote(quoteId: number): Promise<QuoteFormState> {
    const user = await requireUser();

    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) return { error: 'La cotización no existe.' };

    await prisma.quote.delete({ where: { id: quoteId } });

    await prisma.leadActivity.create({
        data: {
            leadId: quote.opportunityId,
            userId: user.id,
            authorName: user.name,
            type: 'NOTA',
            text: `Cotización ${quote.code} eliminada por ${user.name}.`,
        },
    });

    await audit(user, 'COTIZACION_ELIMINADA', 'cotizacion', quote.code);

    revalidatePath('/cotizaciones');
    revalidatePath(`/leads/${quote.opportunityId}`);
    return { success: `Cotización ${quote.code} eliminada.` };
}

/** Eliminación masiva de cotizaciones seleccionadas. */
export async function bulkDeleteQuotes(quoteIds: number[]): Promise<QuoteFormState> {
    const user = await requireUser();
    if (!quoteIds.length) return { error: 'No se seleccionaron cotizaciones.' };

    const quotes = await prisma.quote.findMany({
        where: { id: { in: quoteIds } },
        select: { id: true, code: true, opportunityId: true },
    });

    await prisma.quote.deleteMany({ where: { id: { in: quoteIds } } });
    await audit(user, 'COTIZACIONES_ELIMINADAS_MASIVO', 'cotizacion', `${quotes.length} cotizaciones`, quotes.map((q) => q.code).join(', '));

    revalidatePath('/cotizaciones');
    return { success: `${quotes.length} cotizaciones eliminadas exitosamente.` };
}

/** Cambio de estado masivo de cotizaciones seleccionadas. */
export async function bulkUpdateQuoteStatus(quoteIds: number[], status: string): Promise<QuoteFormState> {
    const user = await requireUser();
    if (!quoteIds.length) return { error: 'No se seleccionaron cotizaciones.' };

    const validStatuses = ['BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA'];
    if (!validStatuses.includes(status)) return { error: 'Estado de cotización inválido.' };

    const quotes = await prisma.quote.findMany({
        where: { id: { in: quoteIds } },
        select: { id: true, code: true, opportunityId: true },
    });

    await prisma.quote.updateMany({
        where: { id: { in: quoteIds } },
        data: { status },
    });

    await audit(user, 'COTIZACIONES_ESTADO_MASIVO', 'cotizacion', `${quotes.length} cotizaciones`, `Nuevo estado: ${status}`);

    revalidatePath('/cotizaciones');
    return { success: `Estado actualizado a "${status}" en ${quotes.length} cotizaciones.` };
}
