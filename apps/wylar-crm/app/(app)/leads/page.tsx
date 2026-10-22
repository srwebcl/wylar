import Link from 'next/link';
import { FileSpreadsheet } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { buildLeadsWhere } from '@/lib/leadsFilter';
import { loadDoNotContactMap } from '@/lib/doNotContact';
import { LeadsSearchBar } from '@/components/LeadsSearchBar';
import { LeadsTable } from '@/components/LeadsTable';
import { CreateLeadModal } from '@/components/CreateLeadModal';
import { Pagination, buildPageHref } from '@/components/ui/Pagination';

const PAGE_SIZE = 50;
const SORTABLE_FIELDS = new Set(['code', 'name', 'type', 'status', 'createdAt']);

function buildOrderBy(params: Record<string, string | undefined>): Prisma.LeadOrderByWithRelationInput {
    const sort = params.sort && SORTABLE_FIELDS.has(params.sort) ? params.sort : 'createdAt';
    const dir = params.dir === 'desc' ? 'desc' : params.sort ? 'asc' : 'desc';
    return { [sort]: dir };
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const currentUser = await requireUser();
    const params = await searchParams;
    const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
    const where = buildLeadsWhere(params);

    const [leads, total, users, categories, products] = await Promise.all([
        prisma.lead.findMany({
            where,
            include: { assignedTo: { omit: { passwordHash: true } }, client: true, product: { include: { category: true } } },
            orderBy: buildOrderBy(params),
            take: PAGE_SIZE,
            skip: (page - 1) * PAGE_SIZE,
        }),
        prisma.lead.count({ where }),
        prisma.user.findMany({ where: { active: true }, orderBy: { name: 'asc' }, omit: { passwordHash: true } }),
        prisma.productCategory.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
        prisma.product.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, categoryId: true } }),
    ]);

    const dncMap = await loadDoNotContactMap(leads.map((l) => ({ email: l.email, phone: l.phone })));

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const exportHref = (() => {
        const qs = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && k !== 'page') as [string, string][]);
        return `/api/leads/export?${qs.toString()}`;
    })();

    return (
        <div>
            <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Oportunidades</h1>
                    <p className="text-slate-500 text-sm mt-1">Cada venta potencial de un cliente — busca, filtra y entra al detalle. {total} en total.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                        href={exportHref}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium px-4 py-2.5 rounded-xl transition-colors"
                        title="Exportar el listado filtrado a Excel"
                    >
                        <FileSpreadsheet size={16} /> Exportar
                    </Link>
                    <CreateLeadModal categories={categories} products={products} />
                </div>
            </div>

            <LeadsSearchBar users={users} categories={categories} products={products} />
            <LeadsTable leads={leads} isAdmin={currentUser.role === 'ADMIN'} dncMap={dncMap} users={users} products={products} />

            <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/leads', params, p)} />
        </div>
    );
}
