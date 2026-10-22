'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import {
    Pencil,
    Trash2,
    Eye,
    CheckSquare,
    Square,
    X,
    Building2,
    Loader2,
    Contact,
    ExternalLink,
} from 'lucide-react';
import { leadTypeLabel } from '@/lib/constants';
import { formatChileanMobile } from '@/lib/phone';
import { deleteClient, bulkDeleteClients, updateClient } from '@/actions/clients';
import type { Client } from '@prisma/client';

type ClientWithCount = Client & { _count: { opportunities: number } };

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';

export function ClientsTable({
    clients,
    isAdmin = false,
}: {
    clients: ClientWithCount[];
    isAdmin?: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Multi-selección
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Modal de edición individual
    const [editingClient, setEditingClient] = useState<ClientWithCount | null>(null);
    const [editName, setEditName] = useState('');
    const [editRut, setEditRut] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editCompany, setEditCompany] = useState('');

    const allIds = useMemo(() => clients.map((c) => c.id), [clients]);
    const isAllSelected = clients.length > 0 && selectedIds.length === clients.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < clients.length;

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

    function openEditModal(c: ClientWithCount) {
        setError(null);
        setSuccess(null);
        setEditingClient(c);
        setEditName(c.name);
        setEditRut(c.rut ?? '');
        setEditEmail(c.email);
        setEditPhone(c.phone);
        setEditCompany(c.company ?? '');
    }

    function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingClient) return;
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.set('name', editName);
        formData.set('rut', editRut);
        formData.set('email', editEmail);
        formData.set('phone', editPhone);
        formData.set('company', editCompany);

        startTransition(async () => {
            const result = await updateClient(editingClient.id, {}, formData);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Cliente actualizado exitosamente.');
                setEditingClient(null);
            }
        });
    }

    function handleDelete(id: number, name: string) {
        if (!confirm(`¿Eliminar al cliente "${name}" y todo su historial de oportunidades? Esta acción no se puede deshacer.`)) return;
        setError(null);
        setSuccess(null);
        setPendingId(id);
        startTransition(async () => {
            const result = await deleteClient(id);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Cliente eliminado.');
                setSelectedIds((prev) => prev.filter((x) => x !== id));
            }
            setPendingId(null);
        });
    }

    function handleBulkDelete() {
        if (!confirm(`¿Eliminar los ${selectedIds.length} clientes seleccionados y sus oportunidades asociadas? Esta acción es irreversible.`)) return;
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkDeleteClients(selectedIds);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Clientes eliminados exitosamente.');
                setSelectedIds([]);
            }
        });
    }

    if (clients.length === 0) {
        return (
            <div className="glass-card bg-white p-12 text-center text-slate-500 border border-slate-200/80 rounded-2xl shadow-sm">
                <Contact size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700">No hay clientes que coincidan con el filtro.</p>
                <p className="text-xs text-slate-400 mt-1">Prueba quitando términos del buscador de clientes.</p>
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

            {/* Barra flotante de acciones masivas (HubSpot / GHL style) */}
            {selectedIds.length > 0 && (
                <div className="sticky top-4 z-30 bg-[#0B1E40] text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 flex-wrap border border-cyan-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <span className="bg-amber-500 text-[#0B1E40] font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                            {selectedIds.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                            {selectedIds.length === 1 ? 'cliente seleccionado' : 'clientes seleccionados'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
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
                            title="Deseleccionar todos"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de edición individual de cliente */}
            {editingClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setEditingClient(null)}>
                    <form
                        onSubmit={handleEditSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-base">Editar Cliente</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Actualiza los datos de contacto corporativos</p>
                            </div>
                            <button type="button" onClick={() => setEditingClient(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo</span>
                                <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">RUT</span>
                                    <input
                                        value={editRut}
                                        onChange={(e) => setEditRut(e.target.value)}
                                        placeholder="12.345.678-9"
                                        className={inputClass}
                                    />
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Empresa / Razón Social</span>
                                    <input
                                        value={editCompany}
                                        onChange={(e) => setEditCompany(e.target.value)}
                                        placeholder="Opcional"
                                        className={inputClass}
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico</span>
                                    <input
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono</span>
                                    <input
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                        placeholder="+56 9 1234 5678"
                                        className={inputClass}
                                        required
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setEditingClient(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-5 py-2 text-xs font-bold bg-[#0B1E40] text-white hover:bg-[#122b59] rounded-lg transition-colors disabled:opacity-60"
                            >
                                {isPending ? 'Guardando…' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Vista móvil: tarjetas táctiles */}
            <div className="sm:hidden space-y-3">
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
                        <span>{isAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}</span>
                    </button>
                    <span>{clients.length} clientes</span>
                </div>

                {clients.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    const formattedPhone = formatChileanMobile(c.phone) ?? c.phone;
                    const formattedEmail = c.email.toLowerCase();
                    const formattedName = c.name.toUpperCase();

                    return (
                        <div
                            key={c.id}
                            className={`glass-card bg-white p-4 space-y-3 rounded-2xl border transition-all ${
                                isSelected ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-slate-200/90'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => toggleSelect(c.id)}
                                        className="mt-0.5 text-slate-400 hover:text-amber-500 transition-colors"
                                    >
                                        {isSelected ? (
                                            <CheckSquare size={18} className="text-amber-500" />
                                        ) : (
                                            <Square size={18} className="text-slate-300" />
                                        )}
                                    </button>
                                    <div className="min-w-0">
                                        <Link href={`/clientes/${c.id}`} className="font-extrabold text-[#0B1E40] hover:text-amber-600 transition-colors text-sm truncate block">
                                            {formattedName}
                                        </Link>
                                        {c.company && (
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                                                <Building2 size={12} className="text-slate-400 shrink-0" /> {c.company.toUpperCase()}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                                            {c.rut && <span>RUT: {c.rut}</span>}
                                            <span>·</span>
                                            <span className="font-medium text-slate-600">{leadTypeLabel(c.type)}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="shrink-0 inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/70">
                                    {c._count.opportunities} {c._count.opportunities === 1 ? 'oportunidad' : 'oportunidades'}
                                </span>
                            </div>

                            {/* Contactos */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <a
                                    href={`tel:${formattedPhone}`}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                                >
                                    📞 {formattedPhone}
                                </a>
                                <a
                                    href={`mailto:${formattedEmail}`}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors truncate"
                                    title={formattedEmail}
                                >
                                    ✉️ {formattedEmail.split('@')[0]}…
                                </a>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <Link href={`/clientes/${c.id}`} className="font-bold text-xs text-amber-700 hover:text-amber-800 inline-flex items-center gap-1">
                                    Ver ficha <ExternalLink size={11} />
                                </Link>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(c)}
                                        className="p-1.5 text-slate-400 hover:text-[#0B1E40] rounded-lg transition-colors"
                                        title="Editar cliente"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(c.id, c.name)}
                                            disabled={isPending && pendingId === c.id}
                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                                            title="Eliminar cliente"
                                        >
                                            {isPending && pendingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Vista desktop: tabla HubSpot / GHL style */}
            <div className="hidden sm:block glass-card bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                <th className="px-4 py-3.5 w-10 text-center">
                                    <button
                                        type="button"
                                        onClick={toggleSelectAll}
                                        className="text-slate-400 hover:text-[#0B1E40] transition-colors inline-flex items-center justify-center"
                                        title={isAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos en esta página'}
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
                                <th className="px-4 py-3.5">Cliente</th>
                                <th className="px-4 py-3.5">RUT</th>
                                <th className="px-4 py-3.5">Correo</th>
                                <th className="px-4 py-3.5">Teléfono</th>
                                <th className="px-4 py-3.5">Tipo</th>
                                <th className="px-4 py-3.5 text-center">Oportunidades</th>
                                <th className="px-4 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {clients.map((c) => {
                                const isSelected = selectedIds.includes(c.id);
                                const formattedPhone = formatChileanMobile(c.phone) ?? c.phone;
                                const formattedEmail = c.email.toLowerCase();
                                const formattedName = c.name.toUpperCase();

                                return (
                                    <tr
                                        key={c.id}
                                        className={`transition-colors ${
                                            isSelected ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/80'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => toggleSelect(c.id)}
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
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#0B1E40]/5 text-[#0B1E40] font-black text-xs flex items-center justify-center border border-[#0B1E40]/10 shrink-0">
                                                    {formattedName.slice(0, 2)}
                                                </div>
                                                <div className="min-w-0">
                                                    <Link href={`/clientes/${c.id}`} className="font-bold text-[#0B1E40] hover:text-amber-600 transition-colors">
                                                        {formattedName}
                                                    </Link>
                                                    {c.company && (
                                                        <span className="block text-xs font-normal text-slate-400 truncate max-w-xs">
                                                            {c.company.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                            {c.rut || <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                                            {formattedEmail}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 text-xs font-medium whitespace-nowrap">
                                            {formattedPhone}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                                                {leadTypeLabel(c.type)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                {c._count.opportunities}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/clientes/${c.id}`}
                                                    className="p-1.5 text-slate-400 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Ver ficha del cliente"
                                                >
                                                    <Eye size={15} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(c)}
                                                    className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Editar cliente"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(c.id, c.name)}
                                                        disabled={isPending && pendingId === c.id}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                                                        title="Eliminar cliente"
                                                    >
                                                        {isPending && pendingId === c.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
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
