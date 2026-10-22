import Link from 'next/link';
import { Plus, FileText, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { QuotesSearchBar } from '@/components/QuotesSearchBar';
import { QuotesTable, type QuoteRow } from '@/components/QuotesTable';

export const dynamic = 'force-dynamic';

function money(amount: number) {
    return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

export default async function CotizacionesPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    await requireUser();
    const params = await searchParams;
    const q = params.q?.trim();
    const status = params.status?.trim();

    const where: any = {};
    if (status) {
        where.status = status;
    }

    if (q) {
        where.OR = [
            { code: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
            {
                opportunity: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { rut: { contains: q, mode: 'insensitive' } },
                        { company: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                    ],
                },
            },
        ];
    }

    const [quotes, allQuotesForStats] = await Promise.all([
        prisma.quote.findMany({
            where,
            include: {
                opportunity: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        rut: true,
                        email: true,
                        phone: true,
                        company: true,
                        comuna: true,
                    },
                },
                items: {
                    select: {
                        id: true,
                        description: true,
                    },
                },
                createdBy: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        }),
        prisma.quote.findMany({
            select: {
                total: true,
                status: true,
            },
        }),
    ]);

    // Métricas globales
    const totalAmount = allQuotesForStats.reduce((sum, it) => sum + Number(it.total), 0);
    const acceptedCount = allQuotesForStats.filter((it) => it.status === 'ACEPTADA').length;
    const activeCount = allQuotesForStats.filter((it) => it.status === 'BORRADOR' || it.status === 'ENVIADA').length;

    const formattedQuotes: QuoteRow[] = quotes.map((quote) => ({
        id: quote.id,
        code: quote.code,
        version: quote.version,
        status: quote.status,
        issueDate: quote.issueDate,
        total: Number(quote.total),
        opportunityId: quote.opportunityId,
        opportunity: quote.opportunity,
        itemsCount: quote.items.length,
        itemsSummary: quote.items.map((it) => it.description).join(', ') || 'Sin ítems',
        createdByName: quote.createdBy?.name,
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Cotizaciones</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Módulo de propuestas económicas oficiales con emisión de PDF y envío por correo a clientes.
                    </p>
                </div>

                <Link
                    href="/cotizaciones/nueva"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
                >
                    <Plus size={16} /> Nueva Cotización
                </Link>
            </div>

            {/* Strip de Métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="glass-card bg-white p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign size={14} className="text-blue-600" /> Monto Total Cotizado
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-[#0B1E40]">{money(totalAmount)}</p>
                    <span className="text-[11px] text-slate-400">{allQuotesForStats.length} cotizaciones históricas</span>
                </div>

                <div className="glass-card bg-white p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={14} className="text-cyan-600" /> Cotizaciones Activas
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-slate-800">{activeCount}</p>
                    <span className="text-[11px] text-slate-400">Borradores y enviadas pendientes</span>
                </div>

                <div className="glass-card bg-white p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" /> Cotizaciones Ganadas
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-700">{acceptedCount}</p>
                    <span className="text-[11px] text-slate-400">Oportunidades cerradas con éxito</span>
                </div>

                <div className="glass-card bg-white p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={14} className="text-[#0B1E40]" /> Total en Vista
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-slate-800">{quotes.length}</p>
                    <span className="text-[11px] text-slate-400">{status || q ? 'Resultados filtrados' : 'Todas las registradas'}</span>
                </div>
            </div>

            <QuotesSearchBar />
            <QuotesTable quotes={formattedQuotes} />
        </div>
    );
}
