'use client';

import { useState, useTransition } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { createCertificationTitle, deleteCertificationTitle, updateCertificationTitle } from '@/actions/certificateMeta';

interface TitleRow {
    id: number;
    name: string;
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';

export function CertificationTitlesManagement({ titles, isAdmin }: { titles: TitleRow[]; isAdmin: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');

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
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Certificaciones</h1>
                <p className="text-slate-500 text-sm mt-1">Nombres sugeridos al escribir en "Nombre de la certificación" al emitir un certificado en /certificados.</p>
            </div>

            <div className="glass-card p-6 space-y-4 max-w-xl">
                <form onSubmit={handleCreate} className="flex gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la certificación" className={inputClass} required />
                    <button type="submit" disabled={isPending} className="shrink-0 flex items-center gap-1.5 bg-[#0B1E40] text-white font-bold px-4 py-2.5 rounded-lg hover:bg-[#122b59] transition-colors disabled:opacity-60">
                        <Plus size={16} /> Agregar
                    </button>
                </form>

                {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

                <ul className="divide-y divide-slate-100">
                    {titles.map((t) =>
                        editingId === t.id ? (
                            <li key={t.id} className="flex items-center gap-2 py-2.5">
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
                                <button onClick={() => handleSaveEdit(t.id)} disabled={isPending} className="shrink-0 p-1.5 text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50" title="Guardar">
                                    <Check size={16} />
                                </button>
                                <button onClick={cancelEdit} className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 transition-colors" title="Cancelar">
                                    <X size={16} />
                                </button>
                            </li>
                        ) : (
                            <li key={t.id} className="flex items-center justify-between py-2.5 group">
                                <span className="text-sm text-slate-700">{t.name}</span>
                                {isAdmin && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(t)} className="p-1.5 text-slate-400 hover:text-[#0B1E40] transition-colors" title="Editar">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(t.id, t.name)} disabled={isPending} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50" title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </li>
                        ),
                    )}
                    {titles.length === 0 && <li className="py-4 text-sm text-slate-400 text-center">Sin certificaciones todavía.</li>}
                </ul>
            </div>
        </div>
    );
}
