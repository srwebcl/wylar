import Link from 'next/link';
import {
    Plus,
    FileText,
    CheckCircle2,
    DollarSign,
    TrendingUp,
    Users,
    Download,
    Eye,
    Briefcase,
    ArrowUpRight,
    Building2,
    BookOpen,
    ShieldCheck,
    Contact,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { CreateLeadModal } from '@/components/CreateLeadModal';

export const dynamic = 'force-dynamic';

function money(amount: number) {
    return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

function formatDate(d: Date | string) {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

const LEAD_STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    NUEVO: { bg: 'bg-cyan-50', text: 'text-cyan-800', dot: 'bg-cyan-500', label: 'Nuevo' },
    EN_ATENCION: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', label: 'En atención' },
    SEGUIMIENTO: { bg: 'bg-indigo-50', text: 'text-indigo-800', dot: 'bg-indigo-500', label: 'Seguimiento' },
    CERRADO: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Cerrado' },
    DESISTIDO: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', label: 'Desistido' },
};

const QUOTE_STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    BORRADOR: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400', label: 'Borrador' },
    ENVIADA: { bg: 'bg-cyan-50', text: 'text-cyan-800', dot: 'bg-cyan-500', label: 'Enviada' },
    REEMPLAZADA: { bg: 'bg-slate-100', text: 'text-slate-400', dot: 'bg-slate-300', label: 'Reemplazada' },
    ACEPTADA: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Aceptada' },
    RECHAZADA: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', label: 'Rechazada' },
};

const TYPE_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    EMPRESA: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Empresa' },
    INSTITUCION: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Institución' },
    OTEC: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'OTEC' },
    ALUMNO_BECADO: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Becado' },
    PERSONA: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: 'Persona' },
};

export default async function DashboardPage() {
    await requireUser();
    const now = new Date();

    const [
        recentLeads,
        totalLeads,
        statusRows,
        recentQuotes,
        allQuotesForStats,
        categories,
        products,
        totalClients,
        activeProfiles,
        certificatesTotal,
        certificatesVigentes,
    ] = await Promise.all([
        prisma.lead.findMany({
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: {
                client: { select: { id: true, name: true, company: true } },
                product: { select: { id: true, name: true } },
                assignedTo: { select: { id: true, name: true } },
            },
        }),
        prisma.lead.count(),
        prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.quote.findMany({
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: {
                opportunity: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        company: true,
                        type: true,
                    },
                },
                createdBy: { select: { name: true } },
                items: { select: { id: true, description: true } },
            },
        }),
        prisma.quote.findMany({
            select: {
                total: true,
                status: true,
            },
        }),
        prisma.productCategory.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
        prisma.product.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, categoryId: true } }),
        prisma.client.count(),
        prisma.profile.count({ where: { active: true } }),
        prisma.certificate.count(),
        prisma.certificate.count({
            where: { revokedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] },
        }),
    ]);

    // Métricas de embudo
    const byStatusMap = new Map<string, number>(statusRows.map((r) => [r.status, r._count._all]));
    const closedLeads = byStatusMap.get('CERRADO') ?? 0;
    const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;
    const activeLeadsCount =
        (byStatusMap.get('NUEVO') ?? 0) +
        (byStatusMap.get('EN_ATENCION') ?? 0) +
        (byStatusMap.get('SEGUIMIENTO') ?? 0);

    // Métricas de cotizaciones
    const totalQuotesCount = allQuotesForStats.length;
    const totalQuotesAmount = allQuotesForStats.reduce((sum, q) => sum + Number(q.total), 0);
    const acceptedQuotes = allQuotesForStats.filter((q) => q.status === 'ACEPTADA');
    const acceptedQuotesCount = acceptedQuotes.length;
    const acceptedQuotesAmount = acceptedQuotes.reduce((sum, q) => sum + Number(q.total), 0);
    const quoteWinRate = totalQuotesCount > 0 ? Math.round((acceptedQuotesCount / totalQuotesCount) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Encabezado con Botones de Acción */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Panel de control ejecutivo — oportunidades activas, cotizaciones recientes e indicadores clave.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <CreateLeadModal categories={categories} products={products} />

                    <Link
                        href="/cotizaciones/nueva"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
                    >
                        <Plus size={15} /> Nueva Cotización
                    </Link>
                </div>
            </div>

            {/* Strip de Indicadores Clave (KPIs Relevantes) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Link
                    href="/leads"
                    className="glass-card bg-white p-4 space-y-1 hover:border-[#0B1E40]/30 transition-all block group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={14} className="text-[#0B1E40]" /> Embudo Comercial
                        </span>
                        <ArrowUpRight size={14} className="text-slate-400 group-hover:text-[#0B1E40] transition-colors" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-[#0B1E40]">{activeLeadsCount}</p>
                    <p className="text-xs text-slate-500">
                        <strong className="text-slate-700">{byStatusMap.get('NUEVO') ?? 0} nuevas</strong> sin gestionar ({totalLeads} total)
                    </p>
                </Link>

                <Link
                    href="/cotizaciones"
                    className="glass-card bg-white p-4 space-y-1 hover:border-blue-400/50 transition-all block group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign size={14} className="text-blue-600" /> Monto Cotizado
                        </span>
                        <ArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-[#0B1E40]">{money(totalQuotesAmount)}</p>
                    <p className="text-xs text-slate-500">{totalQuotesCount} cotizaciones emitidas en total</p>
                </Link>

                <Link
                    href="/cotizaciones?status=ACEPTADA"
                    className="glass-card bg-white p-4 space-y-1 hover:border-emerald-400/50 transition-all block group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600" /> Cotizaciones Ganadas
                        </span>
                        <ArrowUpRight size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600">{acceptedQuotesCount}</p>
                    <p className="text-xs text-slate-500">
                        {money(acceptedQuotesAmount)} ({quoteWinRate}% efectividad)
                    </p>
                </Link>

                <Link
                    href="/leads?status=CERRADO"
                    className="glass-card bg-white p-4 space-y-1 hover:border-indigo-400/50 transition-all block group"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-indigo-600" /> Tasa de Conversión
                        </span>
                        <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-[#0B1E40]">{conversionRate}%</p>
                    <p className="text-xs text-slate-500">{closedLeads} oportunidades cerradas con éxito</p>
                </Link>
            </div>

            {/* Distribución por Estado del Embudo (Navegación Rápida) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Estado del Embudo de Ventas
                    </span>
                    <Link href="/leads" className="text-xs text-[#0B1E40] font-semibold hover:underline flex items-center gap-1">
                        Ver todas las oportunidades &rarr;
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                        { key: 'NUEVO', label: 'Nuevo', border: 'hover:border-cyan-400', count: byStatusMap.get('NUEVO') ?? 0, dot: 'bg-cyan-500' },
                        { key: 'EN_ATENCION', label: 'En Atención', border: 'hover:border-amber-400', count: byStatusMap.get('EN_ATENCION') ?? 0, dot: 'bg-amber-500' },
                        { key: 'SEGUIMIENTO', label: 'Seguimiento', border: 'hover:border-indigo-400', count: byStatusMap.get('SEGUIMIENTO') ?? 0, dot: 'bg-indigo-500' },
                        { key: 'CERRADO', label: 'Cerrado (Ganado)', border: 'hover:border-emerald-400', count: byStatusMap.get('CERRADO') ?? 0, dot: 'bg-emerald-500' },
                        { key: 'DESISTIDO', label: 'Desistido', border: 'hover:border-rose-400', count: byStatusMap.get('DESISTIDO') ?? 0, dot: 'bg-rose-500' },
                    ].map((st) => (
                        <Link
                            key={st.key}
                            href={`/leads?status=${st.key}`}
                            className={`p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all text-left group ${st.border}`}
                        >
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                                <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">
                                    {st.label}
                                </span>
                            </div>
                            <span className="text-xl font-black text-slate-900">{st.count}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Listado 1: Últimas Oportunidades */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[#0B1E40]/5 flex items-center justify-center text-[#0B1E40]">
                            <Briefcase size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Últimas Oportunidades</h2>
                            <p className="text-xs text-slate-500">Prospectos y solicitudes comerciales más recientes</p>
                        </div>
                    </div>
                    <Link
                        href="/leads"
                        className="text-xs font-semibold text-[#0B1E40] hover:text-[#122b59] hover:underline flex items-center gap-1 shrink-0"
                    >
                        Ver todas ({totalLeads}) &rarr;
                    </Link>
                </div>

                {recentLeads.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No hay oportunidades registradas todavía.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                                    <th className="py-2.5 px-4">Código</th>
                                    <th className="py-2.5 px-4">Cliente / Contacto</th>
                                    <th className="py-2.5 px-4">Tipo</th>
                                    <th className="py-2.5 px-4">Producto / Interés</th>
                                    <th className="py-2.5 px-4">Estado</th>
                                    <th className="py-2.5 px-4">Asignado a</th>
                                    <th className="py-2.5 px-4">Fecha</th>
                                    <th className="py-2.5 px-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {recentLeads.map((lead) => {
                                    const st = LEAD_STATUS_CONFIG[lead.status] ?? {
                                        bg: 'bg-slate-100',
                                        text: 'text-slate-700',
                                        dot: 'bg-slate-400',
                                        label: lead.status,
                                    };
                                    const tp = TYPE_CONFIG[lead.type] ?? {
                                        bg: 'bg-slate-100',
                                        text: 'text-slate-700',
                                        border: 'border-slate-200',
                                        label: lead.type,
                                    };

                                    return (
                                        <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-[#0B1E40]">
                                                <Link href={`/leads/${lead.id}`} className="hover:underline">
                                                    {lead.code}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-slate-900 uppercase tracking-tight">
                                                    {lead.name}
                                                </div>
                                                {lead.company && (
                                                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Building2 size={11} /> {lead.company}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${tp.bg} ${tp.text} ${tp.border}`}
                                                >
                                                    {tp.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-medium text-slate-800 line-clamp-1">
                                                    {lead.product?.name ?? lead.certificationInterest ?? 'Sin producto asignado'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${st.bg} ${st.text}`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500">
                                                {lead.assignedTo?.name ? (
                                                    <span className="font-medium text-slate-700">{lead.assignedTo.name}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Sin asignar</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                                {formatDate(lead.createdAt)}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Link
                                                    href={`/leads/${lead.id}`}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B1E40] hover:text-[#122b59] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                                                >
                                                    <Eye size={12} /> Ver
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Listado 2: Listado de Cotizaciones */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-700">
                            <FileText size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Listado de Cotizaciones</h2>
                            <p className="text-xs text-slate-500">Propuestas comerciales oficiales emitidas</p>
                        </div>
                    </div>
                    <Link
                        href="/cotizaciones"
                        className="text-xs font-semibold text-[#0B1E40] hover:text-[#122b59] hover:underline flex items-center gap-1 shrink-0"
                    >
                        Ver todas ({totalQuotesCount}) &rarr;
                    </Link>
                </div>

                {recentQuotes.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No hay cotizaciones emitidas todavía.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                                    <th className="py-2.5 px-4">Código</th>
                                    <th className="py-2.5 px-4">Cliente / Oportunidad</th>
                                    <th className="py-2.5 px-4">Total</th>
                                    <th className="py-2.5 px-4">Estado</th>
                                    <th className="py-2.5 px-4">Detalle ítems</th>
                                    <th className="py-2.5 px-4">Fecha emisión</th>
                                    <th className="py-2.5 px-4">Emisor</th>
                                    <th className="py-2.5 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {recentQuotes.map((quote) => {
                                    const st = QUOTE_STATUS_CONFIG[quote.status] ?? {
                                        bg: 'bg-slate-100',
                                        text: 'text-slate-700',
                                        dot: 'bg-slate-400',
                                        label: quote.status,
                                    };
                                    const itemsText =
                                        quote.items.map((i) => i.description).join(', ') || 'Sin ítems especificados';

                                    return (
                                        <tr key={quote.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-[#0B1E40] whitespace-nowrap">
                                                <Link href={`/cotizaciones/${quote.id}`} className="hover:underline">
                                                    {quote.code}
                                                </Link>
                                                {quote.version > 1 && (
                                                    <span className="ml-1 text-[10px] text-slate-400 font-normal">
                                                        v{quote.version}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Link
                                                    href={`/leads/${quote.opportunity.id}`}
                                                    className="font-semibold text-slate-900 hover:text-[#0B1E40] hover:underline uppercase tracking-tight block"
                                                >
                                                    {quote.opportunity.name}
                                                </Link>
                                                <span className="text-[11px] text-slate-400 font-mono">
                                                    {quote.opportunity.code}
                                                    {quote.opportunity.company ? ` · ${quote.opportunity.company}` : ''}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                                                {money(Number(quote.total))}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${st.bg} ${st.text}`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 max-w-[220px]">
                                                <span className="text-slate-600 line-clamp-1" title={itemsText}>
                                                    {itemsText}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                                {formatDate(quote.issueDate)}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                                {quote.createdBy?.name ?? '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5 justify-end">
                                                    <a
                                                        href={`/api/quotes/${quote.id}/pdf`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Descargar PDF"
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B1E40] hover:bg-slate-100 transition-colors"
                                                    >
                                                        <Download size={14} />
                                                    </a>
                                                    <Link
                                                        href={`/cotizaciones/${quote.id}`}
                                                        title="Ver detalle"
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B1E40] hover:text-[#122b59] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                                                    >
                                                        <Eye size={12} /> Ver
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Accesos Rápidos Complementarios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                    href="/clientes"
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-[#0B1E40]/30 transition-all flex items-center justify-between group shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                            <Contact size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[#0B1E40]">Clientes Registrados</p>
                            <p className="text-[11px] text-slate-400">{totalClients} empresas y personas con historial</p>
                        </div>
                    </div>
                    <ArrowUpRight size={15} className="text-slate-300 group-hover:text-[#0B1E40] transition-colors" />
                </Link>

                <Link
                    href="/productos"
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-amber-400/50 transition-all flex items-center justify-between group shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 group-hover:text-amber-800">Catálogo de Servicios</p>
                            <p className="text-[11px] text-slate-400">{activeProfiles} perfiles técnicos disponibles</p>
                        </div>
                    </div>
                    <ArrowUpRight size={15} className="text-slate-300 group-hover:text-amber-600 transition-colors" />
                </Link>

                <Link
                    href="/certificados"
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-400/50 transition-all flex items-center justify-between group shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-800">Certificados Emitidos</p>
                            <p className="text-[11px] text-slate-400">{certificatesVigentes} vigentes de {certificatesTotal} totales</p>
                        </div>
                    </div>
                    <ArrowUpRight size={15} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </Link>
            </div>
        </div>
    );
}
