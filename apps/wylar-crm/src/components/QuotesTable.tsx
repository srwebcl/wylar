'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { FileText, Download, Mail, CheckCircle2, XCircle, ArrowUpRight, Building2 } from 'lucide-react';
import clsx from 'clsx';
import { markQuoteAccepted, markQuoteRejected } from '@/actions/quotes';
import { SendQuoteModal } from '@/components/SendQuoteModal';

export interface QuoteRow {
    id: number;
    code: string;
    version: number;
    status: string;
    issueDate: Date | string;
    total: number;
    opportunityId: number;
    opportunity: {
        id: number;
        code: string;
        name: string;
        rut?: string | null;
        email: string;
        phone: string;
        company?: string | null;
        comuna?: string | null;
    };
    itemsCount: number;
    itemsSummary: string;
    createdByName?: string | null;
}

const STATUS_STYLE: Record<string, string> = {
    BORRADOR: 'bg-slate-100 text-slate-700 border-slate-200',
    ENVIADA: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    REEMPLAZADA: 'bg-slate-100 text-slate-400 border-slate-200',
    ACEPTADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    RECHAZADA: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_LABEL: Record<string, string> = {
    BORRADOR: 'Borrador',
    ENVIADA: 'Enviada',
    REEMPLAZADA: 'Reemplazada',
    ACEPTADA: 'Aceptada (Ganada)',
    RECHAZADA: 'Rechazada',
};

function money(amount: number) {
    return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

export function QuotesTable({ quotes }: { quotes: QuoteRow[] }) {
    const [selectedForEmail, setSelectedForEmail] = useState<QuoteRow | null>(null);
    const [, startTransition] = useTransition();

    if (quotes.length === 0) {
        return (
            <div className="glass-card p-12 text-center text-slate-500">
                <FileText size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-base text-slate-700">No se encontraron cotizaciones</p>
                <p className="text-xs text-slate-400 mt-1">Crea una nueva cotización o ajusta los filtros de búsqueda.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Vista Móvil: Tarjetas */}
            <div className="lg:hidden space-y-3">
                {quotes.map((q) => {
                    const clientName = q.opportunity.name.toUpperCase();
                    const company = q.opportunity.company?.toUpperCase();

                    return (
                        <div key={q.id} className="glass-card bg-white p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/cotizaciones/${q.id}`}
                                            className="font-extrabold text-[#0B1E40] hover:text-amber-600 transition-colors text-base"
                                        >
                                            {q.code}
                                        </Link>
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                            v{q.version}
                                        </span>
                                    </div>
                                    <p className="font-bold text-slate-800 text-sm mt-1">{clientName}</p>
                                    {company && (
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <Building2 size={12} /> {company}
                                        </p>
                                    )}
                                </div>
                                <span className={clsx('text-[11px] font-bold px-2.5 py-1 rounded-full border', STATUS_STYLE[q.status])}>
                                    {STATUS_LABEL[q.status] ?? q.status}
                                </span>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Oportunidad:</span>
                                    <Link href={`/leads/${q.opportunityId}`} className="font-bold text-blue-700 hover:underline">
                                        {q.opportunity.code}
                                    </Link>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total:</span>
                                    <span className="font-extrabold text-[#0B1E40] text-sm">{money(q.total)} CLP</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-400">
                                    <span>Emisión:</span>
                                    <span>{new Date(q.issueDate).toLocaleDateString('es-CL')}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/api/quotes/${q.id}/pdf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                        title="Descargar PDF"
                                    >
                                        <Download size={14} /> PDF
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedForEmail(q)}
                                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                        title="Enviar por correo"
                                    >
                                        <Mail size={14} /> Enviar
                                    </button>
                                </div>

                                <Link
                                    href={`/cotizaciones/${q.id}`}
                                    className="text-xs font-bold text-[#0B1E40] hover:underline flex items-center gap-1 ml-auto"
                                >
                                    Ver detalle <ArrowUpRight size={13} />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Vista Desktop: Tabla */}
            <div className="hidden lg:block glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Cliente / Oportunidad</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Ítems</th>
                                <th className="px-4 py-3">Total CLP</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {quotes.map((q) => {
                                const clientName = q.opportunity.name.toUpperCase();
                                const company = q.opportunity.company?.toUpperCase();

                                return (
                                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Link
                                                    href={`/cotizaciones/${q.id}`}
                                                    className="font-bold text-[#0B1E40] hover:underline"
                                                >
                                                    {q.code}
                                                </Link>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                                    v{q.version}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-bold text-slate-900 block">{clientName}</span>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                {company && <span>{company}</span>}
                                                {company && <span>·</span>}
                                                <Link
                                                    href={`/leads/${q.opportunityId}`}
                                                    className="text-blue-600 hover:underline font-medium"
                                                >
                                                    {q.opportunity.code}
                                                </Link>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                            {new Date(q.issueDate).toLocaleDateString('es-CL')}
                                        </td>

                                        <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate" title={q.itemsSummary}>
                                            <span className="font-semibold text-slate-700">{q.itemsCount} {q.itemsCount === 1 ? 'ítem' : 'ítems'}:</span> {q.itemsSummary}
                                        </td>

                                        <td className="px-4 py-3 font-extrabold text-[#0B1E40] whitespace-nowrap">
                                            {money(q.total)}
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-full border', STATUS_STYLE[q.status])}>
                                                {STATUS_LABEL[q.status] ?? q.status}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <a
                                                    href={`/api/quotes/${q.id}/pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-[#0B1E40] rounded-lg transition-colors"
                                                    title="Descargar PDF oficial"
                                                >
                                                    <Download size={16} />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedForEmail(q)}
                                                    className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-800 rounded-lg transition-colors"
                                                    title="Enviar cotización por correo"
                                                >
                                                    <Mail size={16} />
                                                </button>
                                                {(q.status === 'BORRADOR' || q.status === 'ENVIADA') && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => startTransition(async () => { await markQuoteAccepted(q.id); })}
                                                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors"
                                                            title="Marcar como Aceptada"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => startTransition(async () => { await markQuoteRejected(q.id); })}
                                                            className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors"
                                                            title="Marcar como Rechazada"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    href={`/cotizaciones/${q.id}`}
                                                    className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-[#0B1E40] rounded-lg transition-colors font-bold text-xs"
                                                    title="Ver ficha completa"
                                                >
                                                    Ver →
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedForEmail && (
                <SendQuoteModal
                    quoteId={selectedForEmail.id}
                    quoteCode={selectedForEmail.code}
                    clientName={selectedForEmail.opportunity.name}
                    defaultEmail={selectedForEmail.opportunity.email}
                    totalAmount={selectedForEmail.total}
                    isOpen={true}
                    onClose={() => setSelectedForEmail(null)}
                />
            )}
        </div>
    );
}
