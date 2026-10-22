import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { QuotePdf } from '@/components/QuotePdf';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) {
        return new Response('No autorizado', { status: 401 });
    }

    const { id } = await params;
    const quoteId = Number(id);
    if (!quoteId || isNaN(quoteId)) {
        return new Response('ID inválido', { status: 400 });
    }

    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: {
            items: true,
            opportunity: true,
            createdBy: true,
        },
    });

    if (!quote) {
        return new Response('Cotización no encontrada', { status: 404 });
    }

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
            executiveName: quote.createdBy?.name ?? null,
        }),
    );

    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="cotizacion-${quote.code}.pdf"`,
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
    });
}
