'use client';

import { useMemo, useState, useTransition } from 'react';
import { Check, Filter, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { createCertificationTitle, deleteCertificationTitle, updateCertificationTitle } from '@/actions/certificateMeta';

export interface TitleRow {
    id: number;
    name: string;
    createdAt: string;
    typeId?: number | null;
    categoryId?: number | null;
    type?: { id: number; label: string; completionText: string } | null;
    category?: { id: number; name: string } | null;
}

export interface TypeOption {
    id: number;
    label: string;
    completionText: string;
}

export interface CategoryOption {
    id: number;
    name: string;
}

const inputClass =
    'w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function CertificationTitlesManagement({
    titles,
    types,
    categories,
    isAdmin,
}: {
    titles: TitleRow[];
    types: TypeOption[];
    categories: CategoryOption[];
    isAdmin: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Formulario de creación
    const [name, setName] = useState('');
    const [typeId, setTypeId] = useState<string>(types[0]?.id ? String(types[0].id) : '');
    const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ? String(categories[0].id) : '');

    // Edición de fila
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editTypeId, setEditTypeId] = useState<string>('');
    const [editCategoryId, setEditCategoryId] = useState<string>('');

    // Filtros
    const [q, setQ] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        return titles.filter((t) => {
            const matchesQuery =
                !query ||
                t.name.toLowerCase().includes(query) ||
                (t.type?.label && t.type.label.toLowerCase().includes(query)) ||
                (t.category?.name && t.category.name.toLowerCase().includes(query));

            const matchesType = filterType === 'all' || (t.typeId ? String(t.typeId) === filterType : filterType === 'none');
            const matchesCategory =
                filterCategory === 'all' || (t.categoryId ? String(t.categoryId) === filterCategory : filterCategory === 'none');

            return matchesQuery && matchesType && matchesCategory;
        });
    }, [titles, q, filterType, filterCategory]);

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!typeId) {
            setError('Debes seleccionar un tipo de certificado.');
            return;
        }
        if (!categoryId) {
            setError('Debes seleccionar una categoría de certificado.');
            return;
        }
        setError(null);
        const formData = new FormData();
        formData.set('name', name);
        formData.set('typeId', typeId);
        formData.set('categoryId', categoryId);

        startTransition(async () => {
            const result = await createCertificationTitle({}, formData);
            if (result.error) {
                setError(result.error);
            } else {
                setName('');
            }
        });
    }

    function startEdit(row: TitleRow) {
        setError(null);
        setEditingId(row.id);
        setEditName(row.name);
        setEditTypeId(row.typeId ? String(row.typeId) : '');
        setEditCategoryId(row.categoryId ? String(row.categoryId) : '');
    }

    function cancelEdit() {
        setEditingId(null);
        setEditName('');
        setEditTypeId('');
        setEditCategoryId('');
    }

    function handleSaveEdit(id: number) {
        if (!editName.trim()) {
            setError('El nombre no puede estar vacío.');
            return;
        }
        setError(null);
        const formData = new FormData();
        formData.set('name', editName);
        if (editTypeId) formData.set('typeId', editTypeId);
        if (editCategoryId) formData.set('categoryId', editCategoryId);

        startTransition(async () => {
            const result = await updateCertificationTitle(id, {}, formData);
            if (result.error) {
                setError(result.error);
            } else {
                cancelEdit();
            }
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
                    <h1 className="text-2xl font-bold text-slate-900">Certificaciones</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Catálogo de certificaciones vinculadas a su tipo de certificado y categoría ({titles.length} en total).
                    </p>
                </div>
            </div>

            {/* Formulario de creación */}
            <div className="glass-card p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-3 bg-white/80">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                        Agregar nueva certificación
                    </h2>
                    <span className="text-xs text-slate-500">
                        Se vincula de inmediato a su tipo y categoría
                    </span>
                </div>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
                    <div className="md:col-span-5">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Nombre de la certificación <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Operador de Grúa Horquilla..."
                            className={inputClass}
                            required
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Tipo de certificado <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={typeId}
                            onChange={(e) => setTypeId(e.target.value)}
                            className={inputClass}
                            required
                        >
                            <option value="" disabled>Seleccionar tipo…</option>
                            {types.map((tp) => (
                                <option key={tp.id} value={tp.id}>
                                    {tp.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Categoría de certificado <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className={inputClass}
                            required
                        >
                            <option value="" disabled>Seleccionar categoría…</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-3 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-60 text-sm whitespace-nowrap h-[38px]"
                            title="Agregar certificación"
                        >
                            <Plus size={16} />
                            <span className="md:hidden">Agregar</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar certificación, tipo o categoría…"
                        className="pl-9 pr-3 py-2 w-full bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40]/15 focus:border-[#0B1E40] outline-none text-sm transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Filter size={13} className="text-slate-400" />
                        <span>Filtros:</span>
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-amber-500"
                    >
                        <option value="all">Todos los tipos</option>
                        {types.map((tp) => (
                            <option key={tp.id} value={tp.id}>
                                {tp.label}
                            </option>
                        ))}
                        <option value="none">Sin tipo asignado</option>
                    </select>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-amber-500"
                    >
                        <option value="all">Todas las categorías</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                        <option value="none">Sin categoría</option>
                    </select>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

            {filtered.length === 0 ? (
                <div className="glass-card p-10 text-center text-slate-400">
                    {titles.length === 0 ? 'Sin certificaciones todavía.' : 'Sin resultados para los filtros seleccionados.'}
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/90 border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                                    <th className="px-5 py-3">Nombre</th>
                                    <th className="px-5 py-3">Tipo de Certificado</th>
                                    <th className="px-5 py-3">Categoría</th>
                                    <th className="px-5 py-3">Creada</th>
                                    <th className="px-5 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((t) =>
                                    editingId === t.id ? (
                                        <tr key={t.id} className="bg-amber-50/40">
                                            <td className="px-5 py-2.5">
                                                <input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className={inputClass}
                                                    autoFocus
                                                    placeholder="Nombre de la certificación"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveEdit(t.id);
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                />
                                            </td>
                                            <td className="px-5 py-2.5">
                                                <select
                                                    value={editTypeId}
                                                    onChange={(e) => setEditTypeId(e.target.value)}
                                                    className={inputClass}
                                                >
                                                    <option value="">Sin tipo</option>
                                                    {types.map((tp) => (
                                                        <option key={tp.id} value={tp.id}>
                                                            {tp.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-5 py-2.5">
                                                <select
                                                    value={editCategoryId}
                                                    onChange={(e) => setEditCategoryId(e.target.value)}
                                                    className={inputClass}
                                                >
                                                    <option value="">Sin categoría</option>
                                                    {categories.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-5 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                                                {formatDate(t.createdAt)}
                                            </td>
                                            <td className="px-5 py-2.5 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleSaveEdit(t.id)}
                                                        disabled={isPending}
                                                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Guardar cambios"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Cancelar"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
                                            <td className="px-5 py-3.5 text-slate-800 font-medium">
                                                {t.name}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {t.type ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                                        {t.type.label}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal text-slate-400 bg-slate-50 border border-dashed border-slate-200">
                                                        Sin tipo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {t.category ? (
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                            t.category.name.toLowerCase().includes('chilevalora')
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        }`}
                                                    >
                                                        {t.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal text-slate-400 bg-slate-50 border border-dashed border-slate-200">
                                                        Sin categoría
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                                                {formatDate(t.createdAt)}
                                            </td>
                                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                {isAdmin && (
                                                    <div className="inline-flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => startEdit(t)}
                                                            className="p-1.5 text-slate-400 hover:text-[#0B1E40] transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(t.id, t.name)}
                                                            disabled={isPending}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                            title="Eliminar"
                                                        >
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
                </div>
            )}
        </div>
    );
}
