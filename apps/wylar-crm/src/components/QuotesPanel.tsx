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
        <div className="glass-card overflow-hidden bg-white">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                    <FileText size={16} className="mr-2 text-[#0B1E40]" /> Cotizaciones ({quotes.length})
                </h3>
                <Link
                    href={`/cotizaciones/nueva?leadId=${opportunityId}`}
                    className="flex items-center gap-1 text-xs font-bold text-[#0B1E40] hover:text-blue-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                >
                    <Plus size={13} /> Nueva cotización
                </Link>
            </div>

            <div className="p-4 space-y-3">
                {quotes.length === 0 && (
                    <div className="py-6 text-center text-slate-400 space-y-2">
                        <p className="text-xs">No hay cotizaciones para esta oportunidad.</p>
                        <Link
                            href={`/cotizaciones/nueva?leadId=${opportunityId}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
                        >
                            <Plus size={13} /> Crear primera cotización
                        </Link>
                    </div>
                )}

                {quotes.map((q) => (
                    <div key={q.id} className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Link
                                    href={`/cotizaciones/${q.id}`}
                                    className="font-extrabold text-slate-800 text-sm hover:text-blue-700 hover:underline"
                                >
                                    {q.code}
                                </Link>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600">
                                    v{q.version}
                                </span>
                            </div>
                            <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full border', STATUS_STYLE[q.status])}>
                                {STATUS_LABEL[q.status] ?? q.status}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">{q.items.length} {q.items.length === 1 ? 'ítem' : 'ítems'}</span>
                            <span className="font-extrabold text-[#0B1E40] text-sm">{money(Number(q.total))}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                            <div className="flex items-center gap-1.5">
                                <a
                                    href={`/api/quotes/${q.id}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-slate-500 hover:text-[#0B1E40] hover:bg-slate-100 rounded transition-colors"
                                    title="Descargar PDF oficial"
                                >
                                    <Download size={14} />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setSelectedForEmail(q)}
                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                    title="Enviar por correo al cliente"
                                >
                                    <Mail size={14} />
                                </button>
                                {(q.status === 'BORRADOR' || q.status === 'ENVIADA') && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => startTransition(async () => { await markQuoteAccepted(q.id); })}
                                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                            title="Aceptar cotización (Cierra como ganada)"
                                        >
                                            <CheckCircle2 size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => startTransition(async () => { await markQuoteRejected(q.id); })}
                                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                            title="Rechazar cotización"
                                        >
                                            <XCircle size={14} />
                                        </button>
                                    </>
                                )}
                            </div>

                            <Link
                                href={`/cotizaciones/${q.id}`}
                                className="font-bold text-xs text-[#0B1E40] hover:underline flex items-center gap-0.5"
                            >
                                Ver ficha <ArrowUpRight size={12} />
                            </Link>
                        </div>
                    </div>
                ))}
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
