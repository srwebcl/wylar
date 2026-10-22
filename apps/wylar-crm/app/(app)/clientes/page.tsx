import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { buildClientsWhere } from '@/lib/clientsFilter';
import { ClientsSearchBar } from '@/components/ClientsSearchBar';
import { ClientsTable } from '@/components/ClientsTable';
import { Pagination, buildPageHref } from '@/components/ui/Pagination';

import { CreateClientModal } from '@/components/CreateClientModal';

const PAGE_SIZE = 50;

export default async function ClientesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const currentUser = await requireUser();
    const params = await searchParams;
    const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
    const where = buildClientsWhere(params);

    const [clients, total] = await Promise.all([
        prisma.client.findMany({
            where,
            include: { _count: { select: { opportunities: true } } },
            orderBy: { createdAt: 'desc' },
            take: PAGE_SIZE,
            skip: (page - 1) * PAGE_SIZE,
        }),
        prisma.client.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
                    <p className="text-slate-500 text-sm mt-1">Ficha única de cada persona u organización — busca, filtra y entra al detalle. {total} en total.</p>
                </div>
                <CreateClientModal />
            </div>

            <ClientsSearchBar />
            <ClientsTable clients={clients} isAdmin={currentUser.role === 'ADMIN'} />
            <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/clientes', params, p)} />
        </div>
    );
}
