'use client';

import { useState, useTransition } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
    createCertificateCategory,
    deleteCertificateCategory,
    updateCertificateCategory,
    createCertificateType,
    deleteCertificateType,
    updateCertificateType,
} from '@/actions/certificateMeta';

interface CategoryRow {
    id: number;
    name: string;
}

interface TypeRow {
    id: number;
    label: string;
    completionText: string;
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';

export function CertificateMetaManagement({ categories, types, isAdmin }: { categories: CategoryRow[]; types: TypeRow[]; isAdmin: boolean }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Tipos y categorías de certificado</h1>
                <p className="text-slate-500 text-sm mt-1">Se usan como opciones al emitir un certificado en /certificados.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoriesPanel categories={categories} isAdmin={isAdmin} />
                <TypesPanel types={types} isAdmin={isAdmin} />
            </div>
        </div>
    );
}

function CategoriesPanel({ categories, isAdmin }: { categories: CategoryRow[]; isAdmin: boolean }) {
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
            const result = await createCertificateCategory({}, formData);
            if (result.error) setError(result.error);
            else setName('');
        });
    }

    function startEdit(row: CategoryRow) {
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
            const result = await updateCertificateCategory(id, {}, formData);
            if (result.error) setError(result.error);
            else cancelEdit();
        });
    }

    function handleDelete(id: number, label: string) {
        if (!confirm(`¿Eliminar la categoría "${label}"? Los certificados ya emitidos con esta categoría no se ven afectados.`)) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteCertificateCategory(id);
            if (result.error) setError(result.error);
        });
    }

    return (
        <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Categorías de certificación</h2>

            <form onSubmit={handleCreate} className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la categoría" className={inputClass} required />
                <button type="submit" disabled={isPending} className="shrink-0 flex items-center gap-1.5 bg-[#0B1E40] text-white font-bold px-4 py-2.5 rounded-lg hover:bg-[#122b59] transition-colors disabled:opacity-60">
                    <Plus size={16} /> Agregar
                </button>
            </form>

            {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <ul className="divide-y divide-slate-100">
                {categories.map((c) =>
                    editingId === c.id ? (
                        <li key={c.id} className="flex items-center gap-2 py-2.5">
                            <input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className={inputClass}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(c.id);
                                    if (e.key === 'Escape') cancelEdit();
                                }}
                            />
                            <button onClick={() => handleSaveEdit(c.id)} disabled={isPending} className="shrink-0 p-1.5 text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50" title="Guardar">
                                <Check size={16} />
                            </button>
                            <button onClick={cancelEdit} className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 transition-colors" title="Cancelar">
                                <X size={16} />
                            </button>
                        </li>
                    ) : (
                        <li key={c.id} className="flex items-center justify-between py-2.5 group">
                            <span className="text-sm text-slate-700">{c.name}</span>
                            {isAdmin && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(c)} className="p-1.5 text-slate-400 hover:text-[#0B1E40] transition-colors" title="Editar">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(c.id, c.name)} disabled={isPending} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50" title="Eliminar">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </li>
                    ),
                )}
                {categories.length === 0 && <li className="py-4 text-sm text-slate-400 text-center">Sin categorías todavía.</li>}
            </ul>
        </div>
    );
}

function TypesPanel({ types, isAdmin }: { types: TypeRow[]; isAdmin: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [label, setLabel] = useState('');
    const [completionText, setCompletionText] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editCompletionText, setEditCompletionText] = useState('');

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const formData = new FormData();
        formData.set('label', label);
        formData.set('completionText', completionText);
        startTransition(async () => {
            const result = await createCertificateType({}, formData);
            if (result.error) setError(result.error);
            else {
                setLabel('');
                setCompletionText('');
            }
        });
    }

    function startEdit(row: TypeRow) {
        setError(null);
        setEditingId(row.id);
        setEditLabel(row.label);
        setEditCompletionText(row.completionText);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditLabel('');
        setEditCompletionText('');
    }

    function handleSaveEdit(id: number) {
        setError(null);
        const formData = new FormData();
        formData.set('label', editLabel);
        formData.set('completionText', editCompletionText);
        startTransition(async () => {
            const result = await updateCertificateType(id, {}, formData);
            if (result.error) setError(result.error);
            else cancelEdit();
        });
    }

    function handleDelete(id: number, display: string) {
        if (!confirm(`¿Eliminar el tipo "${display}"? Los certificados ya emitidos con este tipo no se ven afectados.`)) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteCertificateType(id);
            if (result.error) setError(result.error);
        });
    }

    return (
        <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-slate-900">Tipos de certificado</h2>
            <p className="text-xs text-slate-400 -mt-2">La frase es la que antecede al nombre de la certificación en el PDF, ej. &ldquo;Ha completado satisfactoriamente el curso de&rdquo;.</p>

            <form onSubmit={handleCreate} className="space-y-2">
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nombre corto (ej. Curso)" className={inputClass} required />
                <input
                    value={completionText}
                    onChange={(e) => setCompletionText(e.target.value)}
                    placeholder="Frase completa (ej. Ha completado satisfactoriamente el curso de)"
                    className={inputClass}
                    required
                />
                <button type="submit" disabled={isPending} className="flex items-center gap-1.5 bg-[#0B1E40] text-white font-bold px-4 py-2.5 rounded-lg hover:bg-[#122b59] transition-colors disabled:opacity-60">
                    <Plus size={16} /> Agregar tipo
                </button>
            </form>

            {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <ul className="divide-y divide-slate-100">
                {types.map((t) =>
                    editingId === t.id ? (
                        <li key={t.id} className="py-2.5 space-y-2">
                            <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className={inputClass} autoFocus placeholder="Nombre corto" />
                            <input value={editCompletionText} onChange={(e) => setEditCompletionText(e.target.value)} className={inputClass} placeholder="Frase completa" />
                            <div className="flex justify-end gap-1">
                                <button onClick={() => handleSaveEdit(t.id)} disabled={isPending} className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50">
                                    <Check size={15} /> Guardar
                                </button>
                                <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={15} /> Cancelar
                                </button>
                            </div>
                        </li>
                    ) : (
                        <li key={t.id} className="flex items-center justify-between py-2.5 gap-3 group">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800">{t.label}</p>
                                <p className="text-xs text-slate-400 truncate">{t.completionText}</p>
                            </div>
                            {isAdmin && (
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(t)} className="p-1.5 text-slate-400 hover:text-[#0B1E40] transition-colors" title="Editar">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(t.id, t.label)} disabled={isPending} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50" title="Eliminar">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </li>
                    ),
                )}
                {types.length === 0 && <li className="py-4 text-sm text-slate-400 text-center">Sin tipos todavía.</li>}
            </ul>
        </div>
    );
}
