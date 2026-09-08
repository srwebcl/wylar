import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { LeadDetail } from '@/components/LeadDetail';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const leadId = Number(id);
    if (!Number.isInteger(leadId)) notFound();

    const [lead, users] = await Promise.all([
        prisma.lead.findUnique({
            where: { id: leadId },
            include: { assignedTo: true, activities: { orderBy: { createdAt: 'asc' } } },
        }),
        prisma.user.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    ]);

    if (!lead) notFound();

    return <LeadDetail lead={lead} users={users} />;
}
