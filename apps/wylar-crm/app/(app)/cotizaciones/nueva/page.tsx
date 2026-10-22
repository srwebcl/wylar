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

    const [leads, products] = await Promise.all([
        prisma.lead.findMany({
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
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        }),
        prisma.product.findMany({
            where: { active: true },
            select: {
                id: true,
                name: true,
                price: true,
            },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <QuoteForm
            leads={leads}
            products={products}
            initialLeadId={initialLeadId}
        />
    );
}
