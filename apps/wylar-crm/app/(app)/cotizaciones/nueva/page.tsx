import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { QuoteForm } from '@/components/QuoteForm';

export const dynamic = 'force-dynamic';

export default async function NuevaCotizacionPage({
    searchParams,
}: {
    searchParams: Promise<{ leadId?: string }>;
}) {
    await requireUser();
    const params = await searchParams;
    const initialLeadId = params.leadId ? Number(params.leadId) : undefined;

    const [initialLead, products] = await Promise.all([
        // Solo se trae el lead preseleccionado (si viene de la ficha de una
        // oportunidad) — el resto se busca bajo demanda vía
        // /api/leads/search, nunca se carga el listado completo acá.
        initialLeadId
            ? prisma.lead.findUnique({
                  where: { id: initialLeadId },
                  select: { id: true, code: true, name: true, rut: true, email: true, phone: true, company: true, comuna: true },
              })
            : null,
        prisma.product.findMany({
            where: { active: true },
            select: { id: true, name: true, price: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <QuoteForm
            initialLead={initialLead}
            products={products.map((p) => ({ id: p.id, name: p.name, price: p.price != null ? Number(p.price) : null }))}
        />
    );
}
