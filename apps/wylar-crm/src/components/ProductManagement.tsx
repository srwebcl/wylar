'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Power, Settings, X } from 'lucide-react';
import { createProduct, updateProduct, toggleProductActive } from '@/actions/products';
import { attributeFieldsFor } from '@/lib/productSpec';

interface CategoryRow {
    id: number;
    name: string;
    attributeTemplate: string;
}

interface ProfileRow {
    id: number;
    title: string;
}

interface ProductRow {
    id: number;
    name: string;
    description: string | null;
    price: number | null;
    active: boolean;
    categoryId: number;
    categoryName: string;
    profileId: number | null;
    attributes: Record<string, string> | null;
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';

function money(value: number | null) {
    if (value == null) return '—';
    return `$${Math.round(value).toLocaleString('es-CL')}`;
}

export function ProductManagement({ products, categories, profiles, isAdmin }: { products: ProductRow[]; categories: CategoryRow[]; profiles: ProfileRow[]; isAdmin: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0);
    const [profileId, setProfileId] = useState('');
    const [attributes, setAttributes] = useState<Record<string, string>>({});

    const category = categories.find((c) => c.id === categoryId);
    const attributeFields = category ? attributeFieldsFor(category.attributeTemplate) : [];

    function resetForm() {
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId(categories[0]?.id ?? 0);
        setProfileId('');
        setAttributes({});
    }

    function openCreateForm() {
        setError(null);
        setSuccess(null);
        setEditingId(null);
        resetForm();
        setShowForm(true);
    }

    function openEditForm(p: ProductRow) {
        setError(null);
        setSuccess(null);
        setEditingId(p.id);
        setName(p.name);
        setDescription(p.description ?? '');
        setPrice(p.price != null ? String(p.price) : '');
        setCategoryId(p.categoryId);
        setProfileId(p.profileId != null ? String(p.profileId) : '');
        setAttributes(p.attributes ?? {});
        setShowForm(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.set('categoryId', String(categoryId));
        formData.set('name', name);
        formData.set('description', description);
        formData.set('price', price);
        formData.set('profileId', profileId);
        formData.set('attributes', JSON.stringify(attributes));

        startTransition(async () => {
            const result = editingId != null ? await updateProduct(editingId, {}, formData) : await createProduct({}, formData);
            if (result.error) {
                setError(result.error);
                return;
            }
            setSuccess(result.success ?? 'Producto guardado.');
            resetForm();
            setEditingId(null);
            setShowForm(false);
        });
    }

    function handleToggle(id: number) {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await toggleProductActive(id);
            if (result.error) setError(result.error);
            else setSuccess(result.success ?? null);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Productos</h1>
                    <p className="text-slate-500 text-sm mt-1">Catálogo comercial — lo que se puede vender en una oportunidad. {products.length} en total.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link href="/productos/categorias" className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium px-4 py-2.5 rounded-xl transition-colors">
                        <Settings size={16} /> Categorías
                    </Link>
                    <button onClick={openCreateForm} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                        <Plus size={18} /> Nuevo producto
                    </button>
                </div>
            </div>

            {!showForm && error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            {!showForm && success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl">{success}</div>}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowForm(false)}>
                    <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="glass-card bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-slate-900">{editingId != null ? 'Editar producto' : 'Nuevo producto'}</h2>
                            <button type="button" onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
                                <X size={20} />
                            </button>
                        </div>

                        {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

                        <label className="block">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Categoría</span>
                            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className={inputClass} required>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nombre</span>
                            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
                        </label>
                        <label className="block">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Descripción (opcional)</span>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
                        </label>
                        <label className="block">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Precio (opcional, CLP)</span>
                            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
                        </label>
                        <label className="block">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ficha pública asociada (opcional)</span>
                            <select value={profileId} onChange={(e) => setProfileId(e.target.value)} className={inputClass}>
                                <option value="">Ninguna</option>
                                {profiles.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.title}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {attributeFields.length > 0 && (
                            <div className="space-y-3 border-t border-slate-100 pt-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Atributos de {category?.name}</p>
                                {attributeFields.map((f) => (
                                    <label key={f.key} className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">{f.label}</span>
                                        {f.type === 'select' ? (
                                            <select value={attributes[f.key] ?? ''} onChange={(e) => setAttributes((a) => ({ ...a, [f.key]: e.target.value }))} className={inputClass}>
                                                <option value="">—</option>
                                                {f.options?.map((o) => (
                                                    <option key={o} value={o}>
                                                        {o}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                                value={attributes[f.key] ?? ''}
                                                onChange={(e) => setAttributes((a) => ({ ...a, [f.key]: e.target.value }))}
                                                placeholder={f.placeholder}
                                                className={inputClass}
                                            />
                                        )}
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button type="submit" disabled={isPending} className="bg-[#0B1E40] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#122b59] transition-colors disabled:opacity-60">
                                {isPending ? 'Guardando…' : editingId != null ? 'Guardar cambios' : 'Crear producto'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                                <th className="px-5 py-3">Nombre</th>
                                <th className="px-5 py-3">Categoría</th>
                                <th className="px-5 py-3">Precio</th>
                                <th className="px-5 py-3">Estado</th>
                                <th className="px-5 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.map((p) => (
                                <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${p.active ? '' : 'opacity-50'}`}>
                                    <td className="px-5 py-3.5 font-bold text-slate-900">{p.name}</td>
                                    <td className="px-5 py-3.5 text-slate-500 text-xs">{p.categoryName}</td>
                                    <td className="px-5 py-3.5 text-slate-600">{money(p.price)}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {p.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            {isAdmin && (
                                                <>
                                                    <button onClick={() => openEditForm(p)} className="p-2 text-slate-400 hover:text-amber-600 transition-colors" title="Editar">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => handleToggle(p.id)} disabled={isPending} className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50" title={p.active ? 'Desactivar' : 'Activar'}>
                                                        <Power size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                                        Sin productos todavía.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
