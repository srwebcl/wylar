import Link from 'next/link';
import { FileSpreadsheet } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { buildLeadsWhere } from '@/lib/leadsFilter';
import { loadDoNotContactMap } from '@/lib/doNotContact';
import { LeadsSearchBar } from '@/components/LeadsSearchBar';
import { LeadsTable } from '@/components/LeadsTable';
import { CreateLeadModal } from '@/components/CreateLeadModal';

const PAGE_SIZE = 50;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const currentUser = await requireUser();
    const params = await searchParams;
    const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
    const where = buildLeadsWhere(params);

    const [leads, total, users, certificationRows] = await Promise.all([
        prisma.lead.findMany({
            where,
            include: { assignedTo: { omit: { passwordHash: true } } },
            orderBy: { createdAt: 'desc' },
            take: PAGE_SIZE,
            skip: (page - 1) * PAGE_SIZE,
        }),
        prisma.lead.count({ where }),
        prisma.user.findMany({ where: { active: true }, orderBy: { name: 'asc' }, omit: { passwordHash: true } }),
        prisma.lead.findMany({ select: { certificationInterest: true }, distinct: ['certificationInterest'], where: { certificationInterest: { not: null } } }),
    ]);

    const dncMap = await loadDoNotContactMap(leads.map((l) => ({ email: l.email, phone: l.phone })));

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const pageHref = (p: number) => {
        const qs = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && k !== 'page') as [string, string][]);
        qs.set('page', String(p));
        return `/leads?${qs.toString()}`;
    };
    const exportHref = (() => {
        const qs = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && k !== 'page') as [string, string][]);
        return `/api/leads/export?${qs.toString()}`;
    })();

    return (
        <div>
            <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Prospectos</h1>
                    <p className="text-slate-500 text-sm mt-1">Ficha única de cada cliente — busca, filtra y entra al detalle. {total} en total.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href={exportHref}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium px-4 py-2.5 rounded-xl transition-colors"
                        title="Exportar el listado filtrado a Excel"
                    >
                        <FileSpreadsheet size={16} /> Exportar
                    </Link>
                    <CreateLeadModal certificationSuggestions={certificationRows.map((c) => c.certificationInterest!).filter(Boolean)} />
                </div>
            </div>

            <LeadsSearchBar users={users} />
            <LeadsTable leads={leads} isAdmin={currentUser.role === 'ADMIN'} dncMap={dncMap} />

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
                    <span>Página {Math.min(page, totalPages)} de {totalPages}</span>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <Link href={pageHref(page - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">
                                ← Anterior
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link href={pageHref(page + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">
                                Siguiente →
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
