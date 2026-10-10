'use client';

import { useMemo, useState, useTransition } from 'react';
import { Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { createCertificationTitle, deleteCertificationTitle, updateCertificationTitle } from '@/actions/certificateMeta';

interface TitleRow {
    id: number;
    name: string;
    createdAt: string;
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function CertificationTitlesManagement({ titles, isAdmin }: { titles: TitleRow[]; isAdmin: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [q, setQ] = useState('');

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return titles;
        return titles.filter((t) => t.name.toLowerCase().includes(query));
    }, [titles, q]);

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const formData = new FormData();
        formData.set('name', name);
        startTransition(async () => {
            const result = await createCertificationTitle({}, formData);
            if (result.error) setError(result.error);
            else setName('');
        });
    }

    function startEdit(row: TitleRow) {
        setError(null);
        setEditingId(row.id);
        setEditValue(row.name);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditValue('');
    }

    function handleSaveEdit(id: number) {
        setError(null);
        const formData = new FormData();
        formData.set('name', editValue);
        startTransition(async () => {
            const result = await updateCertificationTitle(id, {}, formData);
            if (result.error) setError(result.error);
            else cancelEdit();
        });
    }

    function handleDelete(id: number, label: string) {
        if (!confirm(`¿Eliminar "${label}" de la lista? Los certificados ya emitidos con este nombre no se ven afectados.`)) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteCertificationTitle(id);
            if (result.error) setError(result.error);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Certificaciones</h1>
                    <p className="text-slate-500 text-sm mt-1">Nombres sugeridos al escribir "Nombre de la certificación" al emitir un certificado. {titles.length} en total.</p>
                </div>
                <form onSubmit={handleCreate} className="flex gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva certificación…" className={`${inputClass} w-64`} required />
                    <button type="submit" disabled={isPending} className="shrink-0 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-60">
                        <Plus size={16} /> Agregar
                    </button>
                </form>
            </div>

            <div className="relative w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar certificación…"
                    className="pl-9 pr-3 py-2 w-full bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40]/15 focus:border-[#0B1E40] outline-none text-sm transition-all"
                />
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

            {filtered.length === 0 ? (
                <div className="glass-card p-10 text-center text-slate-400">{titles.length === 0 ? 'Sin certificaciones todavía.' : 'Sin resultados para tu búsqueda.'}</div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                                <th className="px-5 py-3">Nombre</th>
                                <th className="px-5 py-3">Creada</th>
                                <th className="px-5 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((t) =>
                                editingId === t.id ? (
                                    <tr key={t.id} className="border-b border-slate-50 last:border-0">
                                        <td className="px-5 py-2.5" colSpan={2}>
                                            <input
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className={inputClass}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveEdit(t.id);
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                            />
                                        </td>
                                        <td className="px-5 py-2.5 text-right whitespace-nowrap">
                                            <button onClick={() => handleSaveEdit(t.id)} disabled={isPending} className="p-1.5 text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50" title="Guardar">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors" title="Cancelar">
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-5 py-3.5 text-slate-800 font-medium">{t.name}</td>
                                        <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">{formatDate(t.createdAt)}</td>
                                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                            {isAdmin && (
                                                <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(t)} className="p-1.5 text-slate-400 hover:text-[#0B1E40] transition-colors" title="Editar">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(t.id, t.name)} disabled={isPending} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50" title="Eliminar">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
