import { prisma } from '@/lib/prisma';
import { buildLeadsWhere } from '@/lib/leadsFilter';
import { LeadsSearchBar } from '@/components/LeadsSearchBar';
import { LeadsTable } from '@/components/LeadsTable';

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const params = await searchParams;

    const [leads, users] = await Promise.all([
        prisma.lead.findMany({
            where: buildLeadsWhere(params),
            include: { assignedTo: true },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    ]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Prospectos</h1>
                <p className="text-slate-500 text-sm mt-1">Ficha única de cada cliente — busca, filtra y entra al detalle.</p>
            </div>

            <LeadsSearchBar users={users} />
            <LeadsTable leads={leads} />
        </div>
    );
}
