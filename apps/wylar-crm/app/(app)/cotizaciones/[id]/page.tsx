import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { QuoteDetail } from '@/components/QuoteDetail';

export const dynamic = 'force-dynamic';

export default async function CotizacionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireUser();
    const { id } = await params;
    const quoteId = Number(id);
    if (!quoteId || isNaN(quoteId)) {
        notFound();
    }

    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: {
            opportunity: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    rut: true,
                    email: true,
                    phone: true,
                    company: true,
                    comuna: true,
                    certificationInterest: true,
                    status: true,
                },
            },
            items: {
                select: {
                    id: true,
                    description: true,
                    quantity: true,
                    unitPrice: true,
                    subtotal: true,
                },
                orderBy: { id: 'asc' },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!quote) {
        notFound();
    }

    const formattedQuote = {
        id: quote.id,
        code: quote.code,
        version: quote.version,
        status: quote.status,
        issueDate: quote.issueDate,
        notes: quote.notes,
        total: Number(quote.total),
        createdAt: quote.createdAt,
        createdById: quote.createdById,
        createdBy: quote.createdBy,
        opportunity: quote.opportunity,
        items: quote.items.map((it) => ({
            id: it.id,
            description: it.description,
            quantity: it.quantity,
            unitPrice: Number(it.unitPrice),
            subtotal: Number(it.subtotal),
        })),
    };

    return <QuoteDetail quote={formattedQuote} />;
}
