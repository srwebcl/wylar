'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { FileText, Plus, Download, Mail, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import { markQuoteAccepted, markQuoteRejected } from '@/actions/quotes';
import { SendQuoteModal } from '@/components/SendQuoteModal';
import type { Quote, QuoteItem } from '@prisma/client';

// `total`/`unitPrice`/`subtotal` llegan ya convertidos a number — Prisma
// Decimal no es un objeto plano, no puede cruzar el límite Server->Client.
type QuoteWithItems = Omit<Quote, 'total'> & { total: number; items: (Omit<QuoteItem, 'unitPrice' | 'subtotal'> & { unitPrice: number; subtotal: number })[] };

interface ProductOption {
    id: number;
    name: string;
    price: number | null;
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
    ACEPTADA: 'Aceptada',
    RECHAZADA: 'Rechazada',
};

function money(value: number) {
    return `$${Math.round(value).toLocaleString('es-CL')}`;
}

export function QuotesPanel({
    opportunityId,
    quotes,
    leadName = '',
    leadEmail = '',
}: {
    opportunityId: number;
    quotes: QuoteWithItems[];
    products?: ProductOption[];
    leadName?: string;
    leadEmail?: string;
}) {
    const [selectedForEmail, setSelectedForEmail] = useState<QuoteWithItems | null>(null);
    const [, startTransition] = useTransition();

    return (
        <div className="glass-card overflow-hidden bg-white shadow-sm border border-slate-200">
            <div className="bg-slate-50/80 p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#0B1E40]/5 text-[#0B1E40] rounded-lg">
                        <FileText size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            Cotizaciones de la Oportunidad
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                                {quotes.length}
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                            Propuestas económicas generadas para este prospecto
                        </p>
                    </div>
                </div>

                <Link
                    href={`/cotizaciones/nueva?leadId=${opportunityId}`}
                    className="flex items-center justify-center gap-1.5 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm shrink-0"
                >
                    <Plus size={14} /> Nueva Cotización
                </Link>
            </div>

            <div className="p-0">
                {quotes.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2.5">
                        <FileText size={32} className="mx-auto text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">No hay cotizaciones para esta oportunidad.</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Genera una propuesta formal para enviarle al cliente con PDF oficial y desglose económico.
                        </p>
                        <div className="pt-2">
                            <Link
                                href={`/cotizaciones/nueva?leadId=${opportunityId}`}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-colors"
                            >
                                <Plus size={14} /> Crear primera cotización
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                                    <th className="py-3 px-4">Código / Versión</th>
                                    <th className="py-3 px-4">Fecha Emisión</th>
                                    <th className="py-3 px-4">Detalle / Servicios</th>
                                    <th className="py-3 px-4 text-right">Monto Total</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {quotes.map((q) => (
                                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4 font-extrabold text-[#0B1E40] whitespace-nowrap">
                                            <Link href={`/cotizaciones/${q.id}`} className="hover:underline flex items-center gap-1.5 text-sm">
                                                {q.code}
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                    v{q.version}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                                            {new Date(q.issueDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-700">
                                            <div className="max-w-xs sm:max-w-md truncate font-medium">
                                                {q.items.length === 1
                                                    ? q.items[0]?.description
                                                    : `${q.items.length} ítems: ${q.items[0]?.description}…`}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-black text-[#0B1E40] text-sm whitespace-nowrap">
                                            {money(Number(q.total))} CLP
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <span className={clsx('text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs', STATUS_STYLE[q.status])}>
                                                {STATUS_LABEL[q.status] ?? q.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={`/cotizaciones/${q.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0B1E40] hover:bg-[#122b59] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                                                    title="Ver y editar dentro del módulo de Cotizaciones"
                                                >
                                                    Ver / Editar cotización <ArrowUpRight size={13} />
                                                </Link>
                                                <a
                                                    href={`/api/quotes/${q.id}/pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-slate-500 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                                    title="Descargar PDF oficial"
                                                >
                                                    <Download size={14} />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedForEmail(q)}
                                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                                                    title="Enviar por correo al cliente"
                                                >
                                                    <Mail size={14} />
                                                </button>
                                                {(q.status === 'BORRADOR' || q.status === 'ENVIADA') && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => startTransition(async () => { await markQuoteAccepted(q.id); })}
                                                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                                                            title="Marcar como Aceptada (Ganada)"
                                                        >
                                                            <CheckCircle2 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => startTransition(async () => { await markQuoteRejected(q.id); })}
                                                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                                                            title="Marcar como Rechazada"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedForEmail && (
                <SendQuoteModal
                    quoteId={selectedForEmail.id}
                    quoteCode={selectedForEmail.code}
                    clientName={leadName || 'Cliente'}
                    defaultEmail={leadEmail}
                    totalAmount={Number(selectedForEmail.total)}
                    isOpen={true}
                    onClose={() => setSelectedForEmail(null)}
                />
            )}
        </div>
    );
}
