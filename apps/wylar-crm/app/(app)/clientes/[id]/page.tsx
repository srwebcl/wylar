import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { getClientActivityFeed } from '@/lib/clients';
import { ClientDetail } from '@/components/ClientDetail';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await requireUser();
    const { id } = await params;
    const clientId = Number(id);
    if (!Number.isInteger(clientId)) notFound();

    const [client, contacts, opportunities, activities] = await Promise.all([
        prisma.client.findUnique({ where: { id: clientId } }),
        prisma.clientContact.findMany({ where: { clientId }, orderBy: { createdAt: 'asc' } }),
        prisma.lead.findMany({ where: { clientId }, include: { product: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
        getClientActivityFeed(clientId),
    ]);

    if (!client) notFound();

    return <ClientDetail client={client} contacts={contacts} opportunities={opportunities} activities={activities} />;
}
