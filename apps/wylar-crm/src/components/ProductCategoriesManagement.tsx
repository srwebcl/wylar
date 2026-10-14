'use client';

import { useState, useTransition } from 'react';
import { Check, Pencil, Plus, X, Power } from 'lucide-react';
import { createProductCategory, updateProductCategory, toggleProductCategoryActive } from '@/actions/productCategories';
import { ATTRIBUTE_TEMPLATES, attributeTemplateLabel } from '@/lib/productSpec';

interface CategoryRow {
    id: number;
    name: string;
    attributeTemplate: string;
    active: boolean;
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';

export function ProductCategoriesManagement({ categories, isAdmin }: { categories: CategoryRow[]; isAdmin: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [attributeTemplate, setAttributeTemplate] = useState('GENERICO');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editTemplate, setEditTemplate] = useState('GENERICO');

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const formData = new FormData();
        formData.set('name', name);
        formData.set('attributeTemplate', attributeTemplate);
        startTransition(async () => {
            const result = await createProductCategory({}, formData);
            if (result.error) setError(result.error);
            else {
                setName('');
                setAttributeTemplate('GENERICO');
            }
        });
    }

    function startEdit(row: CategoryRow) {
        setError(null);
        setEditingId(row.id);
        setEditName(row.name);
        setEditTemplate(row.attributeTemplate);
    }

    function cancelEdit() {
        setEditingId(null);
    }

    function handleSaveEdit(id: number) {
        setError(null);
        const formData = new FormData();
        formData.set('name', editName);
        formData.set('attributeTemplate', editTemplate);
        startTransition(async () => {
            const result = await updateProductCategory(id, {}, formData);
            if (result.error) setError(result.error);
            else cancelEdit();
        });
    }

    function handleToggle(id: number) {
        setError(null);
        startTransition(async () => {
            const result = await toggleProductCategoryActive(id);
            if (result.error) setError(result.error);
        });
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Categorías de productos</h1>
                <p className="text-slate-500 text-sm mt-1">Cada categoría define qué atributos extra pide el formulario de producto.</p>
            </div>

            <div className="glass-card p-6 space-y-4 max-w-2xl">
                <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la categoría" className={inputClass} required />
                    <select value={attributeTemplate} onChange={(e) => setAttributeTemplate(e.target.value)} className={inputClass}>
                        {ATTRIBUTE_TEMPLATES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                    <button type="submit" disabled={isPending} className="shrink-0 flex items-center gap-1.5 bg-[#0B1E40] text-white font-bold px-4 py-2.5 rounded-lg hover:bg-[#122b59] transition-colors disabled:opacity-60">
                        <Plus size={16} /> Agregar
                    </button>
                </form>

                {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

                <ul className="divide-y divide-slate-100">
                    {categories.map((c) =>
                        editingId === c.id ? (
                            <li key={c.id} className="py-2.5 space-y-2">
                                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} autoFocus />
                                <select value={editTemplate} onChange={(e) => setEditTemplate(e.target.value)} className={inputClass}>
                                    {ATTRIBUTE_TEMPLATES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex justify-end gap-1">
                                    <button onClick={() => handleSaveEdit(c.id)} disabled={isPending} className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                                        <Check size={15} /> Guardar
                                    </button>
                                    <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-600">
                                        <X size={15} /> Cancelar
                                    </button>
                                </div>
                            </li>
                        ) : (
                            <li key={c.id} className="flex items-center justify-between py-2.5 gap-3 group">
                                <div className={c.active ? '' : 'opacity-50'}>
                                    <p className="text-sm font-bold text-slate-800">{c.name}</p>
                                    <p className="text-xs text-slate-400">{attributeTemplateLabel(c.attributeTemplate)}{!c.active && ' · Inactiva'}</p>
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(c)} className="p-1.5 text-slate-400 hover:text-[#0B1E40] transition-colors" title="Editar">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleToggle(c.id)} disabled={isPending} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50" title={c.active ? 'Desactivar' : 'Activar'}>
                                            <Power size={14} />
                                        </button>
                                    </div>
                                )}
                            </li>
                        ),
                    )}
                    {categories.length === 0 && <li className="py-4 text-sm text-slate-400 text-center">Sin categorías todavía.</li>}
                </ul>
            </div>
        </div>
    );
}
