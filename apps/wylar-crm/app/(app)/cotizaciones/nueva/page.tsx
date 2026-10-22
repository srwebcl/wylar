import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { QuoteForm } from '@/components/QuoteForm';

export const dynamic = 'force-dynamic';

export default async function NuevaCotizacionPage({
    searchParams,
}: {
    searchParams: Promise<{ leadId?: string; fromQuoteId?: string }>;
}) {
    await requireUser();
    const params = await searchParams;
    const initialLeadId = params.leadId ? Number(params.leadId) : undefined;
    const fromQuoteId = params.fromQuoteId ? Number(params.fromQuoteId) : undefined;

    const [fromQuote, products] = await Promise.all([
        fromQuoteId
            ? prisma.quote.findUnique({
                  where: { id: fromQuoteId },
                  include: { items: true },
              })
            : null,
        prisma.product.findMany({
            where: { active: true },
            select: { id: true, name: true, price: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    const targetLeadId = initialLeadId ?? fromQuote?.opportunityId;

    const initialLead = targetLeadId
        ? await prisma.lead.findUnique({
              where: { id: targetLeadId },
              select: { id: true, code: true, name: true, rut: true, email: true, phone: true, company: true, comuna: true },
          })
        : null;

    const initialConditions = fromQuote?.notes
        ? fromQuote.notes.split('\n').map((l) => l.trim()).filter(Boolean)
        : undefined;

    const initialItems = fromQuote?.items.map((it) => ({
        productId: it.productId ? String(it.productId) : '',
        description: it.description,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
    }));

    return (
        <QuoteForm
            initialLead={initialLead}
            products={products.map((p) => ({ id: p.id, name: p.name, price: p.price != null ? Number(p.price) : null }))}
            initialConditions={initialConditions}
            initialItems={initialItems}
        />
    );
}
