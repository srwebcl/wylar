'use client';

import { useState, useTransition, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    Pencil,
    Plus,
    X,
    Power,
    ArrowLeft,
    Trash2,
    Loader2,
    CheckCircle2,
    Package,
} from 'lucide-react';
import {
    createProductCategory,
    updateProductCategory,
    toggleProductCategoryActive,
    deleteProductCategory,
    bulkDeleteProductCategories,
    bulkToggleProductCategories,
} from '@/actions/productCategories';
import { ATTRIBUTE_TEMPLATES, attributeTemplateLabel } from '@/lib/productSpec';
import { Select } from '@/components/ui/Select';

interface CategoryRow {
    id: number;
    name: string;
    attributeTemplate: string;
    active: boolean;
    productsCount?: number;
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';

export function ProductCategoriesManagement({
    categories,
    isAdmin,
}: {
    categories: CategoryRow[];
    isAdmin: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Formulario de creación
    const [name, setName] = useState('');
    const [attributeTemplate, setAttributeTemplate] = useState('GENERICO');

    // Edición en línea
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editTemplate, setEditTemplate] = useState('GENERICO');

    // Multi-selección
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const selectAllRef = useRef<HTMLInputElement>(null);

    const allIds = useMemo(() => categories.map((c) => c.id), [categories]);
    const isAllSelected = categories.length > 0 && selectedIds.length === categories.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < categories.length;

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = isSomeSelected;
        }
    }, [isSomeSelected]);

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

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        const formData = new FormData();
        formData.set('name', name);
        formData.set('attributeTemplate', attributeTemplate);
        startTransition(async () => {
            const result = await createProductCategory({}, formData);
            if (result.error) setError(result.error);
            else {
                setSuccess('Categoría creada exitosamente.');
                setName('');
                setAttributeTemplate('GENERICO');
            }
        });
    }

    function startEdit(row: CategoryRow) {
        setError(null);
        setSuccess(null);
        setEditingId(row.id);
        setEditName(row.name);
        setEditTemplate(row.attributeTemplate);
    }

    function cancelEdit() {
        setEditingId(null);
    }

    function handleSaveEdit(id: number) {
        setError(null);
        setSuccess(null);
        const formData = new FormData();
        formData.set('name', editName);
        formData.set('attributeTemplate', editTemplate);
        startTransition(async () => {
            const result = await updateProductCategory(id, {}, formData);
            if (result.error) setError(result.error);
            else {
                setSuccess('Categoría actualizada exitosamente.');
                cancelEdit();
            }
        });
    }

    function handleToggle(id: number) {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await toggleProductCategoryActive(id);
            if (result.error) setError(result.error);
            else setSuccess(result.success ?? null);
        });
    }

    function handleDelete(id: number, catName: string) {
        if (!confirm(`¿Eliminar la categoría "${catName}"? Solo se puede si no tiene servicios asociados.`)) return;
        setError(null);
        setSuccess(null);
        setPendingId(id);
        startTransition(async () => {
            const result = await deleteProductCategory(id);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Categoría eliminada.');
                setSelectedIds((prev) => prev.filter((x) => x !== id));
            }
            setPendingId(null);
        });
    }

    function handleBulkDelete() {
        if (!confirm(`¿Eliminar las ${selectedIds.length} categorías seleccionadas?`)) return;
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkDeleteProductCategories(selectedIds);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Categorías eliminadas exitosamente.');
                setSelectedIds([]);
            }
        });
    }

    function handleBulkToggle(active: boolean) {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkToggleProductCategories(selectedIds, active);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Estado actualizado exitosamente.');
                setSelectedIds([]);
            }
        });
    }

    return (
        <div className="space-y-6 relative max-w-4xl">
            <div>
                <Link
                    href="/productos"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B1E40] transition-colors mb-2"
                >
                    <ArrowLeft size={14} /> Volver al catálogo
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Categorías del catálogo</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Clasificación comercial y definición de plantilla de atributos para los servicios del Catálogo.
                </p>
            </div>

            {/* Mensajes de feedback */}
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <X size={16} />
                    </button>
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Formulario de creación */}
            <div className="glass-card bg-white p-5 border border-slate-200/90 rounded-2xl shadow-sm space-y-3">
                <span className="text-sm font-semibold text-slate-700 block">
                    Nueva categoría comercial
                </span>
                <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2.5">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre de la categoría (ej. Certificaciones Privadas)"
                        className={inputClass}
                        required
                    />
                    <div className="sm:w-56">
                        <Select
                            value={attributeTemplate}
                            onChange={setAttributeTemplate}
                            options={ATTRIBUTE_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="shrink-0 flex items-center justify-center gap-1.5 bg-[#0B1E40] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[#122b59] transition-colors disabled:opacity-60 text-sm cursor-pointer shadow-sm"
                    >
                        <Plus size={16} /> Agregar
                    </button>
                </form>
            </div>

            {/* Barra flotante de acciones masivas */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0B1E40]/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-cyan-500/30 animate-in fade-in slide-in-from-bottom-4 duration-200 w-[95%] max-w-xl">
                    <div className="flex items-center gap-3">
                        <span className="bg-amber-500 text-[#0B1E40] font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                            {selectedIds.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
                            {selectedIds.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => handleBulkToggle(true)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-200 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                            <CheckCircle2 size={14} /> Activar
                        </button>

                        <button
                            type="button"
                            onClick={() => handleBulkToggle(false)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/20 hover:bg-slate-500 text-slate-200 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                            <Power size={14} /> Desactivar
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

            {/* Listado de categorías */}
            <div className="glass-card bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2.5">
                        <input
                            ref={selectAllRef}
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                            title={isAllSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                        />
                        <span>Categoría</span>
                    </div>
                    <span>Acciones</span>
                </div>

                <ul className="divide-y divide-slate-100">
                    {categories.map((c) => {
                        const isSelected = selectedIds.includes(c.id);

                        return editingId === c.id ? (
                            <li key={c.id} className="p-4 bg-amber-50/30 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className={inputClass}
                                        autoFocus
                                    />
                                    <div className="sm:w-56">
                                        <Select
                                            value={editTemplate}
                                            onChange={setEditTemplate}
                                            options={ATTRIBUTE_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSaveEdit(c.id)}
                                        disabled={isPending}
                                        className="px-4 py-1.5 text-xs font-bold bg-[#0B1E40] text-white hover:bg-[#122b59] rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Guardar cambios
                                    </button>
                                </div>
                            </li>
                        ) : (
                            <li
                                key={c.id}
                                className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                                    isSelected ? 'bg-amber-50/40' : 'hover:bg-slate-50/70'
                                } ${c.active ? '' : 'opacity-60 bg-slate-50/30'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(c.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500/30 cursor-pointer shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {attributeTemplateLabel(c.attributeTemplate)}
                                            </span>
                                            {c.productsCount !== undefined && (
                                                <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1">
                                                    <Package size={12} className="text-slate-400" />
                                                    {c.productsCount} {c.productsCount === 1 ? 'servicio' : 'servicios'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {c.active ? (
                                                <span className="text-emerald-700 font-medium">Activa para catálogo</span>
                                            ) : (
                                                <span className="text-slate-400 font-medium">Inactiva</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => startEdit(c)}
                                            className="p-1.5 text-slate-400 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Editar categoría"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggle(c.id)}
                                            disabled={isPending}
                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                                            title={c.active ? 'Desactivar' : 'Activar'}
                                        >
                                            <Power size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(c.id, c.name)}
                                            disabled={isPending && pendingId === c.id}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Eliminar categoría"
                                        >
                                            {isPending && pendingId === c.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}

                    {categories.length === 0 && (
                        <li className="py-12 text-center text-slate-400 text-sm">
                            Sin categorías registradas en el catálogo.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
