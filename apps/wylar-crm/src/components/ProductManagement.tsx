'use client';

import { useState, useTransition, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    Pencil,
    Plus,
    Power,
    Settings,
    X,
    Search,
    Trash2,
    Loader2,
    CheckCircle2,
    Package,
    Tag,
} from 'lucide-react';
import {
    createProduct,
    updateProduct,
    toggleProductActive,
    deleteProduct,
    bulkDeleteProducts,
    bulkToggleProducts,
} from '@/actions/products';
import { resolveCategoryFields } from '@/lib/productSpec';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';

interface CategoryRow {
    id: number;
    name: string;
    attributeTemplate: string;
    fields?: unknown;
}

interface ProductRow {
    id: number;
    name: string;
    description: string | null;
    price: number | null;
    active: boolean;
    categoryId: number;
    categoryName: string;
    attributes: Record<string, string> | null;
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';

function money(value: number | null) {
    if (value == null) return 'A cotizar';
    return `$${Math.round(value).toLocaleString('es-CL')}`;
}

export function ProductManagement({
    products,
    categories,
    isAdmin,
}: {
    products: ProductRow[];
    categories: CategoryRow[];
    isAdmin: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Multi-selección
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const selectAllRef = useRef<HTMLInputElement>(null);

    // Filtros y búsqueda
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

    // Campos del formulario
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0);
    const [attributes, setAttributes] = useState<Record<string, string>>({});

    const category = categories.find((c) => c.id === categoryId);
    const attributeFields = resolveCategoryFields(category);

    // Métricas del catálogo CRM
    const stats = useMemo(() => {
        const total = products.length;
        const active = products.filter((p) => p.active).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [products]);

    // Productos filtrados
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            // Filtro por búsqueda de texto
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchName = p.name.toLowerCase().includes(q);
                const matchCategory = p.categoryName.toLowerCase().includes(q);
                const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
                if (!matchName && !matchCategory && !matchDesc) return false;
            }

            // Filtro por categoría
            if (selectedCategory !== 'ALL' && String(p.categoryId) !== selectedCategory) {
                return false;
            }

            // Filtro por estado
            if (statusFilter === 'ACTIVE' && !p.active) return false;
            if (statusFilter === 'INACTIVE' && p.active) return false;

            return true;
        });
    }, [products, search, selectedCategory, statusFilter]);

    // Gestión del checkbox maestro (indeterminate state)
    useEffect(() => {
        if (!selectAllRef.current) return;
        const total = filteredProducts.length;
        const selectedCount = selectedIds.length;
        if (selectedCount === 0) {
            selectAllRef.current.checked = false;
            selectAllRef.current.indeterminate = false;
        } else if (selectedCount === total && total > 0) {
            selectAllRef.current.checked = true;
            selectAllRef.current.indeterminate = false;
        } else {
            selectAllRef.current.checked = false;
            selectAllRef.current.indeterminate = true;
        }
    }, [selectedIds, filteredProducts]);

    function handleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.checked) {
            setSelectedIds(filteredProducts.map((p) => p.id));
        } else {
            setSelectedIds([]);
        }
    }

    function handleToggleRow(id: number) {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    }

    function resetForm() {
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId(categories[0]?.id ?? 0);
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
        formData.set('profileId', '');
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
        setPendingId(id);
        startTransition(async () => {
            const result = await toggleProductActive(id);
            setPendingId(null);
            if (result.error) setError(result.error);
            else setSuccess(result.success ?? null);
        });
    }

    function handleDelete(id: number, productName: string) {
        if (!confirm(`¿Estás seguro de eliminar el producto "${productName}" del catálogo del CRM? Esta acción no se puede deshacer.`)) return;
        setError(null);
        setSuccess(null);
        setPendingId(id);
        startTransition(async () => {
            const result = await deleteProduct(id);
            setPendingId(null);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Producto eliminado.');
                setSelectedIds((prev) => prev.filter((item) => item !== id));
            }
        });
    }

    function handleBulkToggle(active: boolean) {
        if (selectedIds.length === 0) return;
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkToggleProducts(selectedIds, active);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? `Se actualizaron ${selectedIds.length} productos.`);
                setSelectedIds([]);
            }
        });
    }

    function handleBulkDelete() {
        if (selectedIds.length === 0) return;
        if (!confirm(`¿Eliminar los ${selectedIds.length} productos seleccionados del catálogo del CRM?`)) return;
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkDeleteProducts(selectedIds);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? `Se eliminaron ${selectedIds.length} productos.`);
                setSelectedIds([]);
            }
        });
    }

    return (
        <div className="space-y-6">
            {/* Header del módulo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Productos</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Catálogo de productos y servicios para cotizaciones y oportunidades en el CRM. {products.length} en total.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <Link
                        href="/productos/categorias"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs text-sm"
                    >
                        <Settings size={15} /> Categorías
                    </Link>
                    <button
                        onClick={openCreateForm}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs text-sm"
                    >
                        <Plus size={16} /> Nuevo producto
                    </button>
                </div>
            </div>

            {/* Tarjetas de métricas de productos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="glass-card bg-white p-4 border border-slate-200/80 rounded-xl">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Productos</p>
                        <Package size={16} className="text-slate-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">En el catálogo del CRM</p>
                </div>

                <div className="glass-card bg-white p-4 border border-slate-200/80 rounded-xl">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Activos</p>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Disponibles para cotizaciones</p>
                </div>

                <div className="glass-card bg-white p-4 border border-slate-200/80 rounded-xl">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inactivos</p>
                        <Power size={16} className="text-slate-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-600 mt-1">{stats.inactive}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Desactivados temporalmente</p>
                </div>

                <div className="glass-card bg-white p-4 border border-slate-200/80 rounded-xl">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categorías</p>
                        <Tag size={16} className="text-amber-500" />
                    </div>
                    <p className="text-2xl font-black text-amber-700 mt-1">{categories.length}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Familias comerciales</p>
                </div>
            </div>

            {/* Mensajes de feedback */}
            {!showForm && error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <X size={16} />
                    </button>
                </div>
            )}
            {!showForm && success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Barra flotante de acciones masivas */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0B1E40]/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-cyan-500/30 animate-in fade-in slide-in-from-bottom-4 duration-200 w-[95%] max-w-2xl">
                    <div className="flex items-center gap-3">
                        <span className="bg-amber-500 text-[#0B1E40] font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                            {selectedIds.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
                            {selectedIds.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
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
                            title="Deseleccionar todos"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Barra de filtros y búsqueda */}
            <div className="glass-card bg-white p-3.5 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, descripción o categoría..."
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white text-slate-900 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:w-52">
                        <Select
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            options={[{ value: 'ALL', label: 'Todas las categorías' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
                        />
                    </div>
                    <div className="flex-1 sm:w-44">
                        <Select
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
                            options={[
                                { value: 'ALL', label: 'Todos los estados' },
                                { value: 'ACTIVE', label: 'Solo activos' },
                                { value: 'INACTIVE', label: 'Solo inactivos' },
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Modal de creación / edición */}
            <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId != null ? 'Editar producto' : 'Nuevo producto'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-xs text-slate-500 -mt-2">Disponible inmediatamente para oportunidades y cotizaciones del CRM.</p>

                    {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

                    <div className="space-y-3.5">
                        <label className="block">
                            <span className="block text-sm font-medium text-slate-700 mb-1.5">Categoría comercial</span>
                            <Select value={String(categoryId)} onChange={(v) => setCategoryId(Number(v))} options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
                        </label>

                        <label className="block">
                            <span className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del producto / curso</span>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Soldador Calificado 3G / Operador Grúa Horquilla"
                                className={inputClass}
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="block text-sm font-medium text-slate-700 mb-1.5">Descripción (opcional)</span>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                placeholder="Resumen o alcance que verá el vendedor en el CRM..."
                                className={inputClass}
                            />
                        </label>

                        <label className="block">
                            <span className="block text-sm font-medium text-slate-700 mb-1.5">Precio de referencia base (CLP, opcional)</span>
                            <input
                                type="number"
                                min={0}
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="Dejar vacío si es 'A cotizar'"
                                className={inputClass}
                            />
                        </label>

                        {attributeFields.length > 0 && (
                            <div className="space-y-3 border-t border-slate-100 pt-3">
                                <p className="text-sm font-medium text-slate-500">Atributos específicos de {category?.name}</p>
                                {attributeFields.map((f) => (
                                    <label key={f.key} className="block">
                                        <span className="block text-xs font-medium text-slate-600 mb-1">{f.label}</span>
                                        {f.type === 'select' ? (
                                            <Select
                                                value={attributes[f.key] ?? ''}
                                                onChange={(v) => setAttributes((a) => ({ ...a, [f.key]: v }))}
                                                placeholder="Seleccionar..."
                                                options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
                                            />
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
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-[#0B1E40] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#122b59] transition-colors disabled:opacity-60 text-sm shadow-sm"
                        >
                            {isPending ? 'Guardando…' : editingId != null ? 'Guardar cambios' : 'Crear producto'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Listado de productos */}
            <div className="space-y-3">
                {/* Vista móvil: tarjetas táctiles */}
                <div className="block lg:hidden space-y-3">
                    <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
                        <label className="inline-flex items-center gap-2 cursor-pointer hover:text-[#0B1E40] transition-colors">
                            <input
                                type="checkbox"
                                ref={selectAllRef}
                                onChange={handleSelectAll}
                                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500/20"
                            />
                            <span>Seleccionar todos</span>
                        </label>
                        <span>{filteredProducts.length} productos</span>
                    </div>

                    {filteredProducts.map((p) => {
                        const isSelected = selectedIds.includes(p.id);
                        return (
                            <div
                                key={p.id}
                                className={`glass-card bg-white p-4 space-y-3 border rounded-xl shadow-xs transition-all ${
                                    isSelected ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400' : 'border-slate-200'
                                } ${p.active ? '' : 'opacity-60'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleRow(p.id)}
                                        className="mt-1 w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500/20 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {p.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        {p.description && (
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {p.categoryName}
                                            </span>
                                            <span className="text-xs font-black text-slate-800">
                                                {money(p.price)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                        <button
                                            onClick={() => openEditForm(p)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0B1E40] bg-amber-100/60 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                                        >
                                            <Pencil size={13} /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleToggle(p.id)}
                                            disabled={isPending && pendingId === p.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <Power size={13} /> {p.active ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id, p.name)}
                                            disabled={isPending && pendingId === p.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 size={13} /> Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Vista desktop: tabla estructurada */}
                <div className="hidden lg:block glass-card bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3.5 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        ref={selectAllRef}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                                    />
                                </th>
                                <th className="px-5 py-3.5">Nombre del Producto</th>
                                <th className="px-5 py-3.5">Categoría</th>
                                <th className="px-5 py-3.5">Precio Base</th>
                                <th className="px-5 py-3.5">Estado</th>
                                <th className="px-5 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map((p) => {
                                const isSelected = selectedIds.includes(p.id);
                                return (
                                    <tr
                                        key={p.id}
                                        className={`hover:bg-slate-50/70 transition-colors ${
                                            isSelected ? 'bg-amber-50/40' : ''
                                        } ${p.active ? '' : 'opacity-60 bg-slate-50/30'}`}
                                    >
                                        <td className="px-5 py-3.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleToggleRow(p.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-bold text-slate-900">{p.name}</p>
                                            {p.description && (
                                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-sm">{p.description}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                {p.categoryName}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 font-black text-slate-800">
                                            {money(p.price)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-100 text-slate-500'}`}>
                                                {p.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => openEditForm(p)}
                                                            className="p-2 text-slate-400 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors"
                                                            title="Editar producto"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggle(p.id)}
                                                            disabled={isPending && pendingId === p.id}
                                                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                                            title={p.active ? 'Desactivar para cotizaciones nuevas' : 'Activar'}
                                                        >
                                                            {isPending && pendingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(p.id, p.name)}
                                                            disabled={isPending && pendingId === p.id}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Eliminar producto"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                                        No se encontraron productos registrados con los filtros actuales.
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
