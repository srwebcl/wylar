import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { buildClientsWhere } from '@/lib/clientsFilter';
import { ClientsSearchBar } from '@/components/ClientsSearchBar';
import { ClientsTable } from '@/components/ClientsTable';

const PAGE_SIZE = 50;

export default async function ClientesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    await requireUser();
    const params = await searchParams;
    const where = buildClientsWhere(params);

    const [clients, total] = await Promise.all([
        prisma.client.findMany({
            where,
            include: { _count: { select: { opportunities: true } } },
            orderBy: { createdAt: 'desc' },
            take: PAGE_SIZE,
        }),
        prisma.client.count({ where }),
    ]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Clientes</h1>
                <p className="text-slate-500 text-sm mt-1">Ficha única de cada persona u organización — busca, filtra y entra al detalle. {total} en total.</p>
            </div>

            <ClientsSearchBar />
            <ClientsTable clients={clients} />
        </div>
    );
}
