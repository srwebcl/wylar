'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import {
    FileText,
    Download,
    Mail,
    CheckCircle2,
    XCircle,
    Building2,
    CheckSquare,
    Square,
    X,
    Trash2,
    Eye,
    Loader2,
    ArrowUpRight,
} from 'lucide-react';
import { markQuoteAccepted, markQuoteRejected, deleteQuote, bulkDeleteQuotes, bulkUpdateQuoteStatus } from '@/actions/quotes';
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; border: string; label: string }> = {
    BORRADOR: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400', border: 'border-slate-200/80', label: 'Borrador' },
    ENVIADA: { bg: 'bg-cyan-50', text: 'text-cyan-800', dot: 'bg-cyan-500', border: 'border-cyan-200/80', label: 'Enviada' },
    REEMPLAZADA: { bg: 'bg-slate-100', text: 'text-slate-400', dot: 'bg-slate-300', border: 'border-slate-200/80', label: 'Reemplazada' },
    ACEPTADA: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', border: 'border-emerald-200/80', label: 'Aceptada' },
    RECHAZADA: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', border: 'border-rose-200/80', label: 'Rechazada' },
};

function money(amount: number) {
    return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

export function QuotesTable({ quotes }: { quotes: QuoteRow[] }) {
    const [selectedForEmail, setSelectedForEmail] = useState<QuoteRow | null>(null);
    const [isPending, startTransition] = useTransition();
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Multi-selección
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
    const [bulkStatusValue, setBulkStatusValue] = useState('ENVIADA');

    const allIds = useMemo(() => quotes.map((q) => q.id), [quotes]);
    const isAllSelected = quotes.length > 0 && selectedIds.length === quotes.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < quotes.length;

    function toggleSelectAll() {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(allIds);
        }
    }

    function toggleSelect(id: number) {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    function handleDelete(quoteId: number, code: string) {
        if (!confirm(`¿Eliminar la cotización ${code}? Esta acción no se puede deshacer.`)) return;
        setError(null);
        setSuccess(null);
        setPendingId(quoteId);
        startTransition(async () => {
            const result = await deleteQuote(quoteId);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Cotización eliminada.');
                setSelectedIds((prev) => prev.filter((x) => x !== quoteId));
            }
            setPendingId(null);
        });
    }

    function handleBulkDelete() {
        if (!confirm(`¿Eliminar las ${selectedIds.length} cotizaciones seleccionadas? Esta acción no se puede deshacer.`)) return;
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkDeleteQuotes(selectedIds);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Cotizaciones eliminadas exitosamente.');
                setSelectedIds([]);
            }
        });
    }

    function handleBulkStatusSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkUpdateQuoteStatus(selectedIds, bulkStatusValue);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Estados actualizados.');
                setShowBulkStatusModal(false);
                setSelectedIds([]);
            }
        });
    }

    if (quotes.length === 0) {
        return (
            <div className="glass-card bg-white p-12 text-center text-slate-500 border border-slate-200/80 rounded-2xl shadow-sm">
                <FileText size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-base text-slate-700">No se encontraron cotizaciones</p>
                <p className="text-xs text-slate-400 mt-1">Crea una nueva cotización o ajusta los filtros de búsqueda.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative">
            {/* Mensajes de feedback */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                    </button>
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Barra flotante de acciones masivas */}
            {selectedIds.length > 0 && (
                <div className="sticky top-4 z-30 bg-[#0B1E40] text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 flex-wrap border border-cyan-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <span className="bg-amber-500 text-[#0B1E40] font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                            {selectedIds.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                            {selectedIds.length === 1 ? 'cotización seleccionada' : 'cotizaciones seleccionadas'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setShowBulkStatusModal(true)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                            <CheckCircle2 size={14} className="text-cyan-400" /> Cambiar estado
                        </button>

                        <button
                            type="button"
                            onClick={handleBulkDelete}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                            <Trash2 size={14} /> Eliminar
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
                            title="Deseleccionar todas"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de cambio masivo de estado de cotización */}
            {showBulkStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setShowBulkStatusModal(false)}>
                    <form
                        onSubmit={handleBulkStatusSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-slate-900 text-base">
                                Cambiar estado de {selectedIds.length} cotizaciones
                            </h3>
                            <button type="button" onClick={() => setShowBulkStatusModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <label className="block">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nuevo estado</span>
                            <select
                                value={bulkStatusValue}
                                onChange={(e) => setBulkStatusValue(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                            >
                                <option value="BORRADOR">Borrador</option>
                                <option value="ENVIADA">Enviada</option>
                                <option value="ACEPTADA">Aceptada (Ganada)</option>
                                <option value="RECHAZADA">Rechazada</option>
                            </select>
                        </label>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowBulkStatusModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-5 py-2 text-xs font-bold bg-[#0B1E40] text-white hover:bg-[#122b59] rounded-lg transition-colors disabled:opacity-60"
                            >
                                {isPending ? 'Guardando…' : 'Aplicar cambio'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Vista Móvil: Tarjetas táctiles */}
            <div className="lg:hidden space-y-3">
                <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
                    <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="inline-flex items-center gap-2 hover:text-[#0B1E40] transition-colors"
                    >
                        {isAllSelected ? (
                            <CheckSquare size={16} className="text-amber-500" />
                        ) : (
                            <Square size={16} className="text-slate-400" />
                        )}
                        <span>{isAllSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}</span>
                    </button>
                    <span>{quotes.length} cotizaciones</span>
                </div>

                {quotes.map((q) => {
                    const isSelected = selectedIds.includes(q.id);
                    const clientName = q.opportunity.name.toUpperCase();
                    const company = q.opportunity.company?.toUpperCase();
                    const badge = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.BORRADOR;

                    return (
                        <div
                            key={q.id}
                            className={`glass-card bg-white p-4 space-y-3 rounded-2xl border transition-all ${
                                isSelected ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-slate-200/90'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => toggleSelect(q.id)}
                                        className="mt-0.5 text-slate-400 hover:text-amber-500 transition-colors"
                                    >
                                        {isSelected ? (
                                            <CheckSquare size={18} className="text-amber-500" />
                                        ) : (
                                            <Square size={18} className="text-slate-300" />
                                        )}
                                    </button>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <Link
                                                href={`/cotizaciones/${q.id}`}
                                                className="font-extrabold text-[#0B1E40] hover:text-amber-600 transition-colors text-base"
                                            >
                                                {q.code}
                                            </Link>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                                v{q.version}
                                            </span>
                                        </div>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">{clientName}</p>
                                        {company && (
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                                <Building2 size={12} className="text-slate-400 shrink-0" /> {company}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                    {badge.label}
                                </span>
                            </div>

                            <div className="p-2.5 bg-slate-50/90 rounded-xl text-xs space-y-1.5 border border-slate-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Oportunidad:</span>
                                    <Link href={`/leads/${q.opportunityId}`} className="font-bold text-blue-700 hover:underline">
                                        {q.opportunity.code}
                                    </Link>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Total neto:</span>
                                    <span className="font-extrabold text-[#0B1E40] text-sm">{money(q.total)} CLP</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-400">
                                    <span>Emisión: {new Date(q.issueDate).toLocaleDateString('es-CL')}</span>
                                    <span>{q.itemsCount} {q.itemsCount === 1 ? 'ítem' : 'ítems'}</span>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <a
                                        href={`/api/quotes/${q.id}/pdf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                        title="Descargar PDF"
                                    >
                                        <Download size={13} /> PDF
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedForEmail(q)}
                                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                        title="Enviar por correo"
                                    >
                                        <Mail size={13} /> Enviar
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/cotizaciones/${q.id}`}
                                        className="font-bold text-xs text-amber-700 hover:text-amber-800 inline-flex items-center gap-0.5"
                                    >
                                        Ver <ArrowUpRight size={12} />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(q.id, q.code)}
                                        disabled={isPending && pendingId === q.id}
                                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                        title="Eliminar cotización"
                                    >
                                        {isPending && pendingId === q.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Vista Desktop: Tabla HubSpot / GHL style */}
            <div className="hidden lg:block glass-card bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                <th className="px-4 py-3.5 w-10 text-center">
                                    <button
                                        type="button"
                                        onClick={toggleSelectAll}
                                        className="text-slate-400 hover:text-[#0B1E40] transition-colors inline-flex items-center justify-center"
                                        title={isAllSelected ? 'Deseleccionar todas' : 'Seleccionar todas en esta página'}
                                    >
                                        {isAllSelected ? (
                                            <CheckSquare size={16} className="text-amber-500" />
                                        ) : isSomeSelected ? (
                                            <CheckSquare size={16} className="text-slate-400 opacity-60" />
                                        ) : (
                                            <Square size={16} className="text-slate-300" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3.5">Código</th>
                                <th className="px-4 py-3.5">Cliente & Oportunidad</th>
                                <th className="px-4 py-3.5">Fecha</th>
                                <th className="px-4 py-3.5">Ítems Cotizados</th>
                                <th className="px-4 py-3.5">Total CLP</th>
                                <th className="px-4 py-3.5">Estado</th>
                                <th className="px-4 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {quotes.map((q) => {
                                const isSelected = selectedIds.includes(q.id);
                                const clientName = q.opportunity.name.toUpperCase();
                                const company = q.opportunity.company?.toUpperCase();
                                const badge = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.BORRADOR;

                                return (
                                    <tr
                                        key={q.id}
                                        className={`transition-colors ${
                                            isSelected ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/80'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => toggleSelect(q.id)}
                                                className="text-slate-400 hover:text-amber-500 transition-colors inline-flex items-center justify-center"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare size={16} className="text-amber-500" />
                                                ) : (
                                                    <Square size={16} className="text-slate-300" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Link
                                                    href={`/cotizaciones/${q.id}`}
                                                    className="font-mono font-bold text-[#0B1E40] hover:text-amber-600 transition-colors"
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

                                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                            {new Date(q.issueDate).toLocaleDateString('es-CL')}
                                        </td>

                                        <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate" title={q.itemsSummary}>
                                            <span className="font-semibold text-slate-700">{q.itemsCount} {q.itemsCount === 1 ? 'ítem' : 'ítems'}:</span> {q.itemsSummary}
                                        </td>

                                        <td className="px-4 py-3 font-extrabold text-[#0B1E40] whitespace-nowrap">
                                            {money(q.total)}
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                                {badge.label}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <a
                                                    href={`/api/quotes/${q.id}/pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0B1E40] rounded-lg transition-colors"
                                                    title="Descargar PDF oficial"
                                                >
                                                    <Download size={15} />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedForEmail(q)}
                                                    className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-800 rounded-lg transition-colors"
                                                    title="Enviar cotización por correo"
                                                >
                                                    <Mail size={15} />
                                                </button>
                                                {(q.status === 'BORRADOR' || q.status === 'ENVIADA') && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => startTransition(async () => { await markQuoteAccepted(q.id); })}
                                                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors"
                                                            title="Marcar como Aceptada"
                                                        >
                                                            <CheckCircle2 size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => startTransition(async () => { await markQuoteRejected(q.id); })}
                                                            className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors"
                                                            title="Marcar como Rechazada"
                                                        >
                                                            <XCircle size={15} />
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    href={`/cotizaciones/${q.id}`}
                                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#0B1E40] rounded-lg transition-colors"
                                                    title="Ver ficha completa"
                                                >
                                                    <Eye size={15} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(q.id, q.code)}
                                                    disabled={isPending && pendingId === q.id}
                                                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Eliminar cotización"
                                                >
                                                    {isPending && pendingId === q.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                                </button>
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
