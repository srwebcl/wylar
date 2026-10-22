'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import {
    Trash2,
    Loader2,
    ShieldOff,
    Contact,
    MapPin,
    CheckSquare,
    Square,
    X,
    UserCheck,
    CheckCircle2,
    Eye,
    ExternalLink,
} from 'lucide-react';
import { sourceLabel, statusLabel, STATUSES } from '@/lib/constants';
import { deleteLead, bulkDeleteLeads, bulkUpdateLeadStatus, bulkAssignLeads } from '@/actions/leads';
import { formatChileanMobile } from '@/lib/phone';
import type { Lead, Product, ProductCategory } from '@prisma/client';
import type { SafeUser as User } from '@/lib/safeUser';

type LeadWithAssignee = Lead & { assignedTo: User | null; product: (Product & { category: ProductCategory }) | null };

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    NUEVO: { bg: 'bg-cyan-50', text: 'text-cyan-800', dot: 'bg-cyan-500', border: 'border-cyan-200/80' },
    EN_ATENCION: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', border: 'border-amber-200/80' },
    SEGUIMIENTO: { bg: 'bg-indigo-50', text: 'text-indigo-800', dot: 'bg-indigo-500', border: 'border-indigo-200/80' },
    CERRADO: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', border: 'border-emerald-200/80' },
    DESISTIDO: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', border: 'border-rose-200/80' },
};

export function LeadsTable({
    leads,
    isAdmin = false,
    dncMap = new Map(),
    users = [],
}: {
    leads: LeadWithAssignee[];
    isAdmin?: boolean;
    dncMap?: Map<string, string>;
    users?: User[];
}) {
    const [isPending, startTransition] = useTransition();
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Multi-selección
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Modales de acciones masivas
    const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
    const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
    const [bulkStatusValue, setBulkStatusValue] = useState('EN_ATENCION');
    const [bulkLostReason, setBulkLostReason] = useState('');
    const [bulkAssigneeValue, setBulkAssigneeValue] = useState<string>('');

    const allIds = useMemo(() => leads.map((l) => l.id), [leads]);
    const isAllSelected = leads.length > 0 && selectedIds.length === leads.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < leads.length;

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

    function handleDelete(id: number, code: string, name: string) {
        if (!confirm(`¿Eliminar la oportunidad ${code} (${name})? Esta acción no se puede deshacer.`)) return;
        setError(null);
        setSuccess(null);
        setPendingId(id);
        startTransition(async () => {
            const result = await deleteLead(id);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Oportunidad eliminada.');
                setSelectedIds((prev) => prev.filter((x) => x !== id));
            }
            setPendingId(null);
        });
    }

    function handleBulkDelete() {
        if (!confirm(`¿Eliminar las ${selectedIds.length} oportunidades seleccionadas? Esta acción no se puede deshacer.`)) return;
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkDeleteLeads(selectedIds);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Oportunidades eliminadas.');
                setSelectedIds([]);
            }
        });
    }

    function handleBulkStatusSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkUpdateLeadStatus(selectedIds, bulkStatusValue, bulkLostReason);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Estados actualizados.');
                setShowBulkStatusModal(false);
                setSelectedIds([]);
            }
        });
    }

    function handleBulkAssignSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        const targetUserId = bulkAssigneeValue === '' ? null : Number(bulkAssigneeValue);
        startTransition(async () => {
            const result = await bulkAssignLeads(selectedIds, targetUserId);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Responsables reasignados.');
                setShowBulkAssignModal(false);
                setSelectedIds([]);
            }
        });
    }

    if (leads.length === 0) {
        return (
            <div className="glass-card bg-white p-12 text-center text-slate-500 border border-slate-200/80 rounded-2xl shadow-sm">
                <p className="font-semibold text-slate-700">No hay oportunidades que coincidan con el filtro.</p>
                <p className="text-xs text-slate-400 mt-1">Prueba quitando filtros de búsqueda o ingresa una nueva oportunidad.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative">
            {/* Feedback messages */}
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

            {/* Barra flotante de acciones masivas (HubSpot / GHL style) */}
            {selectedIds.length > 0 && (
                <div className="sticky top-4 z-30 bg-[#0B1E40] text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 flex-wrap border border-cyan-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <span className="bg-amber-500 text-[#0B1E40] font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                            {selectedIds.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                            {selectedIds.length === 1 ? 'oportunidad seleccionada' : 'oportunidades seleccionadas'}
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
                            onClick={() => setShowBulkAssignModal(true)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                            <UserCheck size={14} className="text-amber-400" /> Reasignar
                        </button>

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={handleBulkDelete}
                                disabled={isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                                <Trash2 size={14} /> Eliminar
                            </button>
                        )}

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

            {/* Modal de Cambio de Estado Masivo */}
            {showBulkStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setShowBulkStatusModal(false)}>
                    <form
                        onSubmit={handleBulkStatusSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-slate-900 text-base">
                                Cambiar estado de {selectedIds.length} oportunidades
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
                                {STATUSES.map((st) => (
                                    <option key={st.value} value={st.value}>
                                        {st.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {bulkStatusValue === 'DESISTIDO' && (
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Motivo del desistimiento</span>
                                <textarea
                                    value={bulkLostReason}
                                    onChange={(e) => setBulkLostReason(e.target.value)}
                                    placeholder="Indica la razón de cierre perdido..."
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                    rows={2}
                                    required
                                />
                            </label>
                        )}

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
                                {isPending ? 'Actualizando…' : 'Aplicar cambio'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal de Reasignación Masiva */}
            {showBulkAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setShowBulkAssignModal(false)}>
                    <form
                        onSubmit={handleBulkAssignSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-slate-900 text-base">
                                Reasignar {selectedIds.length} oportunidades
                            </h3>
                            <button type="button" onClick={() => setShowBulkAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <label className="block">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nuevo responsable comercial</span>
                            <select
                                value={bulkAssigneeValue}
                                onChange={(e) => setBulkAssigneeValue(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                            >
                                <option value="">-- Sin asignar --</option>
                                {users.map((u) => (
                                    <option key={u.id} value={String(u.id)}>
                                        {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowBulkAssignModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-5 py-2 text-xs font-bold bg-[#0B1E40] text-white hover:bg-[#122b59] rounded-lg transition-colors disabled:opacity-60"
                            >
                                {isPending ? 'Guardando…' : 'Reasignar oportunidades'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Vista móvil: tarjetas interactivas */}
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
                    <span>{leads.length} oportunidades</span>
                </div>

                {leads.map((lead) => {
                    const isSelected = selectedIds.includes(lead.id);
                    const isDnc = dncMap.has(`${lead.email}|${lead.phone}`);
                    const formattedPhone = formatChileanMobile(lead.phone) ?? lead.phone;
                    const formattedEmail = lead.email.toLowerCase();
                    const formattedName = lead.name.toUpperCase();
                    const badge = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.NUEVO;

                    return (
                        <div
                            key={lead.id}
                            className={`glass-card bg-white p-4 space-y-3 rounded-2xl border transition-all ${
                                isSelected ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-slate-200/90'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => toggleSelect(lead.id)}
                                        className="mt-0.5 text-slate-400 hover:text-amber-500 transition-colors"
                                    >
                                        {isSelected ? (
                                            <CheckSquare size={18} className="text-amber-500" />
                                        ) : (
                                            <Square size={18} className="text-slate-300" />
                                        )}
                                    </button>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Link
                                                href={`/leads/${lead.id}`}
                                                className="font-extrabold text-[#0B1E40] hover:text-amber-600 transition-colors text-sm truncate"
                                            >
                                                {formattedName}
                                            </Link>
                                            {isDnc && (
                                                <span title={`No contactar: ${dncMap.get(`${lead.email}|${lead.phone}`)}`} className="shrink-0">
                                                    <ShieldOff size={14} className="text-red-500" />
                                                </span>
                                            )}
                                            <Link
                                                href={`/clientes/${lead.clientId}`}
                                                title="Ver ficha del cliente"
                                                className="text-slate-400 hover:text-[#0B1E40] transition-colors"
                                            >
                                                <Contact size={14} />
                                            </Link>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                                            <span className="font-mono font-bold text-slate-600">{lead.code}</span>
                                            {lead.rut && <span>· {lead.rut}</span>}
                                            {lead.comuna && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    <MapPin size={11} className="text-slate-400" /> {lead.comuna}
                                                </span>
                                            )}
                                            {lead.company && <span className="truncate">· {lead.company.toUpperCase()}</span>}
                                        </div>
                                    </div>
                                </div>

                                <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                    {statusLabel(lead.status)}
                                </span>
                            </div>

                            {/* Producto o servicio */}
                            <div className="bg-slate-50/80 rounded-xl p-2.5 text-xs border border-slate-100">
                                <span className="text-slate-400 font-medium">Interés: </span>
                                <span className="font-bold text-slate-800">
                                    {lead.product?.name ?? lead.certificationInterest ?? 'No especificado'}
                                </span>
                                {lead.product?.category && <span className="text-slate-500"> ({lead.product.category.name})</span>}
                            </div>

                            {/* Contactos */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <a
                                    href={`tel:${lead.phone}`}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    📞 {formattedPhone}
                                </a>
                                <a
                                    href={`mailto:${formattedEmail}`}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors truncate"
                                    title={formattedEmail}
                                >
                                    ✉️ {formattedEmail.split('@')[0]}…
                                </a>
                            </div>

                            {/* Footer de tarjeta */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-medium text-slate-400">Resp:</span>
                                    <span className="text-slate-700 font-semibold truncate">{lead.assignedTo?.name ?? 'Sin asignar'}</span>
                                    <span className="text-slate-300">·</span>
                                    <span>{sourceLabel(lead.source)}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        href={`/leads/${lead.id}`}
                                        className="font-bold text-xs text-amber-700 hover:text-amber-800 inline-flex items-center gap-0.5"
                                    >
                                        Ver <ExternalLink size={11} />
                                    </Link>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(lead.id, lead.code, lead.name)}
                                            disabled={isPending && pendingId === lead.id}
                                            title="Eliminar oportunidad"
                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            {isPending && pendingId === lead.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Vista desktop: tabla HubSpot / GHL style */}
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
                                <th className="px-4 py-3.5">Contacto / Empresa</th>
                                <th className="px-4 py-3.5">RUT</th>
                                <th className="px-4 py-3.5">Comuna</th>
                                <th className="px-4 py-3.5">Teléfono & Correo</th>
                                <th className="px-4 py-3.5">Producto / Servicio</th>
                                <th className="px-4 py-3.5">Responsable</th>
                                <th className="px-4 py-3.5">Estado</th>
                                <th className="px-4 py-3.5">Ingreso</th>
                                <th className="px-4 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leads.map((lead) => {
                                const isSelected = selectedIds.includes(lead.id);
                                const formattedPhone = formatChileanMobile(lead.phone) ?? lead.phone;
                                const formattedEmail = lead.email.toLowerCase();
                                const formattedName = lead.name.toUpperCase();
                                const badge = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.NUEVO;

                                return (
                                    <tr
                                        key={lead.id}
                                        className={`transition-colors ${
                                            isSelected ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/80'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => toggleSelect(lead.id)}
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
                                            <Link href={`/leads/${lead.id}`} className="font-mono font-bold text-[#0B1E40] hover:text-amber-600 transition-colors">
                                                {lead.code}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                {dncMap.has(`${lead.email}|${lead.phone}`) && (
                                                    <span title={`No contactar: ${dncMap.get(`${lead.email}|${lead.phone}`)}`} className="shrink-0">
                                                        <ShieldOff size={13} className="text-red-500" />
                                                    </span>
                                                )}
                                                <Link href={`/leads/${lead.id}`} className="hover:text-amber-600 transition-colors">
                                                    {formattedName}
                                                </Link>
                                                <Link
                                                    href={`/clientes/${lead.clientId}`}
                                                    title="Ver ficha del cliente"
                                                    className="text-slate-300 hover:text-[#0B1E40] transition-colors"
                                                >
                                                    <Contact size={13} />
                                                </Link>
                                            </div>
                                            {lead.company && <span className="block text-xs font-normal text-slate-400 truncate max-w-xs">{lead.company.toUpperCase()}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                            {lead.rut || <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                                            {lead.comuna ? (
                                                <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                                    <MapPin size={10} className="text-slate-400" /> {lead.comuna}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                                            <p className="font-semibold text-slate-800">{formattedPhone}</p>
                                            <p className="text-slate-400 text-[11px] truncate max-w-[160px]">{formattedEmail}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs max-w-[200px]">
                                            <p className="font-medium text-slate-800 truncate">
                                                {lead.product?.name ?? lead.certificationInterest ?? '—'}
                                            </p>
                                            {lead.product?.category && (
                                                <span className="text-[11px] text-slate-400">{lead.product.category.name}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                                            {lead.assignedTo?.name ? (
                                                <span className="font-semibold text-slate-700">{lead.assignedTo.name}</span>
                                            ) : (
                                                <span className="text-slate-400 italic">Sin asignar</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                                {statusLabel(lead.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                            {new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(lead.createdAt))}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/leads/${lead.id}`}
                                                    className="p-1.5 text-slate-400 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Ver detalle de oportunidad"
                                                >
                                                    <Eye size={15} />
                                                </Link>
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(lead.id, lead.code, lead.name)}
                                                        disabled={isPending && pendingId === lead.id}
                                                        title="Eliminar oportunidad"
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                                                    >
                                                        {isPending && pendingId === lead.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
