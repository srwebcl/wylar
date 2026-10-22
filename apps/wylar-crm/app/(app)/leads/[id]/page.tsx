import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { LeadDetail } from '@/components/LeadDetail';
import { checkDoNotContact } from '@/lib/doNotContact';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const leadId = Number(id);
    if (!Number.isInteger(leadId)) notFound();

    const [lead, users] = await Promise.all([
        prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                assignedTo: { omit: { passwordHash: true } },
                activities: { orderBy: { createdAt: 'asc' } },
                client: true,
                product: { include: { category: true } },
                quotes: { include: { items: true }, orderBy: { version: 'desc' } },
            },
        }),
        prisma.user.findMany({ where: { active: true }, orderBy: { name: 'asc' }, omit: { passwordHash: true } }),
    ]);

    if (!lead) notFound();

    const dnc = await checkDoNotContact(lead.email, lead.phone);
    const products = await prisma.product.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, price: true } });

    // Prisma Decimal no es un objeto plano — no se puede pasar tal cual de
    // un Server Component a uno Client, hay que convertirlo a number antes.
    const serializedLead = {
        ...lead,
        quotes: lead.quotes.map((q) => ({
            ...q,
            total: Number(q.total),
            items: q.items.map((it) => ({ ...it, unitPrice: Number(it.unitPrice), subtotal: Number(it.subtotal) })),
        })),
    };
    const serializedProducts = products.map((p) => ({ ...p, price: p.price != null ? Number(p.price) : null }));

    return <LeadDetail lead={serializedLead} users={users} dncReason={dnc?.reason ?? null} products={serializedProducts} />;
}
