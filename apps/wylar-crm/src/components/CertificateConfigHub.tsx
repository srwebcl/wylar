'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
    Award,
    FileText,
    Layers,
    ArrowLeft,
    Plus,
    Search,
    Filter,
    Pencil,
    Trash2,
    Check,
    X,
    Sparkles,
    ShieldCheck,
} from 'lucide-react';
import {
    createCertificationTitle,
    deleteCertificationTitle,
    updateCertificationTitle,
    createCertificateType,
    deleteCertificateType,
    updateCertificateType,
    createCertificateCategory,
    deleteCertificateCategory,
    updateCertificateCategory,
} from '@/actions/certificateMeta';

export interface TitleRow {
    id: number;
    name: string;
    createdAt: string;
    typeId?: number | null;
    categoryId?: number | null;
    type?: { id: number; label: string; completionText: string } | null;
    category?: { id: number; name: string } | null;
}

export interface TypeRow {
    id: number;
    label: string;
    completionText: string;
}

export interface CategoryRow {
    id: number;
    name: string;
}

interface CertificateConfigHubProps {
    titles: TitleRow[];
    types: TypeRow[];
    categories: CategoryRow[];
    isAdmin: boolean;
    initialTab?: 'certificaciones' | 'tipos' | 'categorias';
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-400';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function CertificateConfigHub({
    titles,
    types,
    categories,
    isAdmin,
    initialTab = 'certificaciones',
}: CertificateConfigHubProps) {
    const [activeTab, setActiveTab] = useState<'certificaciones' | 'tipos' | 'categorias'>(initialTab);

    // Compute title counts per type and category
    const typeUsageCount = useMemo(() => {
        const counts: Record<number, number> = {};
        for (const t of titles) {
            if (t.typeId) counts[t.typeId] = (counts[t.typeId] || 0) + 1;
        }
        return counts;
    }, [titles]);

    const categoryUsageCount = useMemo(() => {
        const counts: Record<number, number> = {};
        for (const t of titles) {
            if (t.categoryId) counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
        }
        return counts;
    }, [titles]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
                        <ShieldCheck size={14} />
                        <span>MÓDULO DE CERTIFICADOS</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Catálogo y Configuración
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 max-w-2xl">
                        Gestiona de forma unificada el catálogo de certificaciones, los tipos de acreditación con su texto de diploma y las categorías de validez oficial.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/certificados"
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-xs sm:text-sm transition-all shadow-xs"
                    >
                        <ArrowLeft size={15} />
                        <span>Volver a Certificados</span>
                    </Link>
                </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Stat 1: Certificaciones */}
                <button
                    type="button"
                    onClick={() => setActiveTab('certificaciones')}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        activeTab === 'certificaciones'
                            ? 'bg-amber-50/80 border-amber-300 shadow-sm ring-2 ring-amber-500/20'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-700 transition-colors">
                                Catálogo
                            </span>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900">
                                {titles.length}
                            </div>
                            <p className="text-xs text-slate-500">
                                Certificaciones activas registradas
                            </p>
                        </div>
                        <div
                            className={`p-2.5 rounded-xl transition-colors ${
                                activeTab === 'certificaciones'
                                    ? 'bg-amber-500 text-[#0B1E40]'
                                    : 'bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-800'
                            }`}
                        >
                            <Award size={20} />
                        </div>
                    </div>
                </button>

                {/* Stat 2: Tipos */}
                <button
                    type="button"
                    onClick={() => setActiveTab('tipos')}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        activeTab === 'tipos'
                            ? 'bg-blue-50/80 border-blue-300 shadow-sm ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-700 transition-colors">
                                Diplomas
                            </span>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900">
                                {types.length}
                            </div>
                            <p className="text-xs text-slate-500">
                                Tipos con frase de completitud
                            </p>
                        </div>
                        <div
                            className={`p-2.5 rounded-xl transition-colors ${
                                activeTab === 'tipos'
                                    ? 'bg-[#0B1E40] text-amber-400'
                                    : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-800'
                            }`}
                        >
                            <FileText size={20} />
                        </div>
                    </div>
                </button>

                {/* Stat 3: Categorías */}
                <button
                    type="button"
                    onClick={() => setActiveTab('categorias')}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        activeTab === 'categorias'
                            ? 'bg-emerald-50/80 border-emerald-300 shadow-sm ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-700 transition-colors">
                                Marco Legal
                            </span>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900">
                                {categories.length}
                            </div>
                            <p className="text-xs text-slate-500">
                                Categorías de certificación
                            </p>
                        </div>
                        <div
                            className={`p-2.5 rounded-xl transition-colors ${
                                activeTab === 'categorias'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                            }`}
                        >
                            <Layers size={20} />
                        </div>
                    </div>
                </button>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 max-w-fit overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab('certificaciones')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                        activeTab === 'certificaciones'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                >
                    <Award size={16} className={activeTab === 'certificaciones' ? 'text-amber-500' : 'text-slate-400'} />
                    <span>Certificaciones</span>
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                            activeTab === 'certificaciones' ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-200/70 text-slate-600'
                        }`}
                    >
                        {titles.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('tipos')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                        activeTab === 'tipos'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                >
                    <FileText size={16} className={activeTab === 'tipos' ? 'text-blue-600' : 'text-slate-400'} />
                    <span>Tipos de Certificado</span>
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                            activeTab === 'tipos' ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-slate-200/70 text-slate-600'
                        }`}
                    >
                        {types.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('categorias')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                        activeTab === 'categorias'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                >
                    <Layers size={16} className={activeTab === 'categorias' ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>Categorías</span>
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                            activeTab === 'categorias' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-slate-200/70 text-slate-600'
                        }`}
                    >
                        {categories.length}
                    </span>
                </button>
            </div>

            {/* Tab 1: Certificaciones */}
            {activeTab === 'certificaciones' && (
                <CertificationsTab
                    titles={titles}
                    types={types}
                    categories={categories}
                    isAdmin={isAdmin}
                    onSwitchToTypes={() => setActiveTab('tipos')}
                    onSwitchToCategories={() => setActiveTab('categorias')}
                />
            )}

            {/* Tab 2: Tipos de Certificado */}
            {activeTab === 'tipos' && (
                <TypesTab types={types} isAdmin={isAdmin} typeUsageCount={typeUsageCount} />
            )}

            {/* Tab 3: Categorías */}
            {activeTab === 'categorias' && (
                <CategoriesTab
                    categories={categories}
                    titles={titles}
                    isAdmin={isAdmin}
                    categoryUsageCount={categoryUsageCount}
                />
            )}
        </div>
    );
}

// -------------------------------------------------------------
// TAB 1: CERTIFICACIONES
// -------------------------------------------------------------
function CertificationsTab({
    titles,
    types,
    categories,
    isAdmin,
    onSwitchToTypes,
    onSwitchToCategories,
}: {
    titles: TitleRow[];
    types: TypeRow[];
    categories: CategoryRow[];
    isAdmin: boolean;
    onSwitchToTypes: () => void;
    onSwitchToCategories: () => void;
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
        <div className="space-y-5">
            {/* Formulario de creación */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                        <h2 className="text-sm font-bold text-slate-900">Agregar nueva certificación</h2>
                    </div>
                    <span className="text-xs text-slate-400">
                        Se vinculará de inmediato a su tipo y categoría por defecto al emitir
                    </span>
                </div>

                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
                    <div className="md:col-span-5">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Nombre de la certificación <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Operador de Grúa Horquilla, Soldador 1G..."
                            className={inputClass}
                            required
                        />
                    </div>

                    <div className="md:col-span-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-700">
                                Tipo de certificado <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={onSwitchToTypes}
                                className="text-[11px] text-amber-700 hover:text-amber-800 hover:underline font-medium"
                            >
                                + Configurar tipos
                            </button>
                        </div>
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
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-700">
                                Categoría de certificado <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={onSwitchToCategories}
                                className="text-[11px] text-amber-700 hover:text-amber-800 hover:underline font-medium"
                            >
                                + Configurar categorías
                            </button>
                        </div>
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
                            className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-3 py-2.5 rounded-lg transition-colors shadow-xs disabled:opacity-60 text-sm whitespace-nowrap h-[42px]"
                            title="Agregar certificación"
                        >
                            <Plus size={16} />
                            <span className="md:hidden">Agregar</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar certificación, tipo o categoría…"
                        className="pl-9 pr-3 py-2.5 w-full bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1E40]/15 focus:border-[#0B1E40] outline-none text-sm transition-all shadow-xs"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Filter size={13} className="text-slate-400" />
                        <span>Filtrar:</span>
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
                    >
                        <option value="all">Todos los tipos ({types.length})</option>
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
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
                    >
                        <option value="all">Todas las categorías ({categories.length})</option>
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

            {/* Tabla de Certificaciones */}
            {filtered.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 space-y-2">
                    <Award size={36} className="mx-auto text-slate-300 stroke-1" />
                    <p className="font-medium text-slate-600">
                        {titles.length === 0 ? 'Sin certificaciones en el catálogo todavía.' : 'Sin resultados para los filtros seleccionados.'}
                    </p>
                    <p className="text-xs text-slate-400">
                        {titles.length === 0
                            ? 'Usa el formulario superior para registrar la primera certificación.'
                            : 'Prueba buscando con otro término o limpiando los filtros.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/90 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-5 py-3.5">Nombre de la Certificación</th>
                                    <th className="px-5 py-3.5">Tipo Asociado</th>
                                    <th className="px-5 py-3.5">Categoría Asociada</th>
                                    <th className="px-5 py-3.5">Fecha</th>
                                    <th className="px-5 py-3.5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((t) =>
                                    editingId === t.id ? (
                                        <tr key={t.id} className="bg-amber-50/50">
                                            <td className="px-5 py-3">
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
                                            <td className="px-5 py-3">
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
                                            <td className="px-5 py-3">
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
                                            <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                                                {formatDate(t.createdAt)}
                                            </td>
                                            <td className="px-5 py-3 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleSaveEdit(t.id)}
                                                        disabled={isPending}
                                                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Guardar cambios"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Cancelar"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-5 py-3.5">
                                                <div className="font-semibold text-slate-900">{t.name}</div>
                                                {t.type?.completionText && (
                                                    <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                                                        Diploma: &ldquo;{t.type.completionText}&rdquo;
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {t.type ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        {t.type.label}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200">
                                                        Sin tipo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {t.category ? (
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                            t.category.name.toLowerCase().includes('chilevalora')
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                t.category.name.toLowerCase().includes('chilevalora')
                                                                    ? 'bg-blue-600'
                                                                    : 'bg-emerald-600'
                                                            }`}
                                                        />
                                                        {t.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200">
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
                                                            className="p-1.5 text-slate-400 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors"
                                                            title="Editar certificación"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(t.id, t.name)}
                                                            disabled={isPending}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Eliminar certificación"
                                                        >
                                                            <Trash2 size={15} />
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

// -------------------------------------------------------------
// TAB 2: TIPOS DE CERTIFICADO & FRASES
// -------------------------------------------------------------
function TypesTab({
    types,
    isAdmin,
    typeUsageCount,
}: {
    types: TypeRow[];
    isAdmin: boolean;
    typeUsageCount: Record<number, number>;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Formulario de creación
    const [label, setLabel] = useState('');
    const [completionText, setCompletionText] = useState('');

    // Edición
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
        const count = typeUsageCount[id] || 0;
        const msg = count > 0
            ? `¿Eliminar el tipo "${display}"? Hay ${count} certificaciones asociadas en el catálogo (quedarán sin tipo asignado). Los certificados ya emitidos en PDF no se modifican.`
            : `¿Eliminar el tipo "${display}"? Los certificados ya emitidos no se modifican.`;
        if (!confirm(msg)) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteCertificateType(id);
            if (result.error) setError(result.error);
        });
    }

    return (
        <div className="space-y-6">
            {/* Banner explicativo visual */}
            <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-amber-50/40 border border-blue-200/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                    <FileText size={18} />
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                    <p className="font-bold text-slate-900">
                        ¿Cómo funciona el Tipo de Certificado en el diploma?
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                        El <strong>Nombre corto</strong> se usa en los selectores del sistema (ej: <em>Curso</em>, <em>Calificación</em>).
                        La <strong>Frase para el diploma</strong> es la oración exacta que se imprime en el PDF justo antes del nombre de la certificación, por ejemplo:{' '}
                        <span className="font-semibold text-slate-800 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                            &ldquo;Ha completado satisfactoriamente el curso de [Nombre]&rdquo;
                        </span>.
                    </p>
                </div>
            </div>

            {/* Formulario para agregar tipo */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-500/20" />
                    <h2 className="text-sm font-bold text-slate-900">Agregar nuevo tipo de certificado</h2>
                </div>

                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
                    <div className="md:col-span-4">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Nombre corto <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Ej. Curso, Calificación, Inspección..."
                            className={inputClass}
                            required
                        />
                    </div>

                    <div className="md:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Frase para el diploma <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={completionText}
                            onChange={(e) => setCompletionText(e.target.value)}
                            placeholder="Ej. Ha completado satisfactoriamente el curso de..."
                            className={inputClass}
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-1.5 bg-[#0B1E40] hover:bg-[#122b59] text-white font-bold px-4 py-2.5 rounded-lg transition-colors shadow-xs disabled:opacity-60 text-sm h-[42px]"
                        >
                            <Plus size={16} />
                            <span>Agregar tipo</span>
                        </button>
                    </div>
                </form>

                {label && completionText && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-500 shrink-0" />
                        <span>
                            <strong>Vista previa del texto en PDF:</strong> &ldquo;{completionText}{' '}
                            <span className="font-semibold text-amber-700">[Nombre de la Certificación]</span>&rdquo;
                        </span>
                    </div>
                )}
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

            {/* Listado de Tipos con tarjetas detalladas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {types.map((t) => {
                    const count = typeUsageCount[t.id] || 0;
                    const isEditing = editingId === t.id;

                    return (
                        <div
                            key={t.id}
                            className={`bg-white border rounded-2xl p-5 transition-all shadow-xs space-y-3 relative group ${
                                isEditing ? 'border-amber-400 ring-2 ring-amber-500/20' : 'border-slate-200/90 hover:border-slate-300'
                            }`}
                        >
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre corto</label>
                                        <input
                                            value={editLabel}
                                            onChange={(e) => setEditLabel(e.target.value)}
                                            className={inputClass}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Frase para el diploma</label>
                                        <input
                                            value={editCompletionText}
                                            onChange={(e) => setEditCompletionText(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            onClick={() => handleSaveEdit(t.id)}
                                            disabled={isPending}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                                        >
                                            <Check size={14} /> Guardar
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            <X size={14} /> Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                                <Award size={13} className="text-amber-600" />
                                                {t.label}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {count} {count === 1 ? 'certificación vinculada' : 'certificaciones vinculadas'}
                                            </span>
                                        </div>

                                        {isAdmin && (
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(t)}
                                                    className="p-1.5 text-slate-400 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Editar tipo"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id, t.label)}
                                                    disabled={isPending}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Eliminar tipo"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Preview bubble */}
                                    <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                                            Texto impreso en diploma:
                                        </span>
                                        <p className="text-xs text-slate-700 italic leading-relaxed">
                                            &ldquo;{t.completionText}&rdquo;
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// TAB 3: CATEGORÍAS
// -------------------------------------------------------------
function CategoriesTab({
    categories,
    titles,
    isAdmin,
    categoryUsageCount,
}: {
    categories: CategoryRow[];
    titles: TitleRow[];
    isAdmin: boolean;
    categoryUsageCount: Record<number, number>;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Formulario de creación
    const [name, setName] = useState('');

    // Edición
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
        const count = categoryUsageCount[id] || 0;
        const msg = count > 0
            ? `¿Eliminar la categoría "${label}"? Hay ${count} certificaciones asociadas en el catálogo (quedarán sin categoría). Los certificados ya emitidos en PDF no se modifican.`
            : `¿Eliminar la categoría "${label}"? Los certificados ya emitidos no se modifican.`;
        if (!confirm(msg)) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteCertificateCategory(id);
            if (result.error) setError(result.error);
        });
    }

    return (
        <div className="space-y-6">
            {/* Banner explicativo visual */}
            <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-blue-50/40 border border-emerald-200/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                    <Layers size={18} />
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                    <p className="font-bold text-slate-900">
                        ¿Cómo funcionan las Categorías de Certificado?
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                        Clasifican el respaldo o entidad certificadora bajo la cual se emite el documento (por ejemplo:{' '}
                        <strong>Certificación Privada</strong> para cursos directos de Wylar, o{' '}
                        <strong>ChileValora</strong> para procesos de acreditación oficial bajo el Sistema Nacional de Certificación de Competencias Laborales).
                    </p>
                </div>
            </div>

            {/* Formulario para agregar categoría */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-500/20" />
                    <h2 className="text-sm font-bold text-slate-900">Agregar nueva categoría</h2>
                </div>

                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <div className="flex-1">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nombre de la categoría (ej. Certificación Privada, ChileValora, SENCE...)"
                            className={inputClass}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="shrink-0 flex items-center justify-center gap-1.5 bg-[#0B1E40] hover:bg-[#122b59] text-white font-bold px-5 py-2.5 rounded-lg transition-colors shadow-xs disabled:opacity-60 text-sm"
                    >
                        <Plus size={16} />
                        <span>Agregar categoría</span>
                    </button>
                </form>
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

            {/* Listado de Categorías en tarjetas elegantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((c) => {
                    const count = categoryUsageCount[c.id] || 0;
                    const isEditing = editingId === c.id;
                    const sampleTitles = titles.filter((t) => t.categoryId === c.id).slice(0, 3);
                    const isChileValora = c.name.toLowerCase().includes('chilevalora');

                    return (
                        <div
                            key={c.id}
                            className={`bg-white border rounded-2xl p-5 transition-all shadow-xs space-y-3.5 relative group ${
                                isEditing ? 'border-emerald-400 ring-2 ring-emerald-500/20' : 'border-slate-200/90 hover:border-slate-300'
                            }`}
                        >
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de categoría</label>
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
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleSaveEdit(c.id)}
                                            disabled={isPending}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                                        >
                                            <Check size={14} /> Guardar
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            <X size={14} /> Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                                        isChileValora
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            isChileValora ? 'bg-blue-600' : 'bg-emerald-600'
                                                        }`}
                                                    />
                                                    {c.name}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {count} {count === 1 ? 'certificación registrada' : 'certificaciones registradas'}
                                            </p>
                                        </div>

                                        {isAdmin && (
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(c)}
                                                    className="p-1.5 text-slate-400 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Editar categoría"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id, c.name)}
                                                    disabled={isPending}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Eliminar categoría"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Muestra de certificaciones con esta categoría */}
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                            Ejemplos en catálogo:
                                        </span>
                                        {sampleTitles.length > 0 ? (
                                            <ul className="space-y-1">
                                                {sampleTitles.map((st) => (
                                                    <li key={st.id} className="flex items-center gap-1.5 text-slate-700 truncate">
                                                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                                                        <span className="truncate">{st.name}</span>
                                                    </li>
                                                ))}
                                                {count > 3 && (
                                                    <li className="text-[11px] text-slate-400 italic">
                                                        + {count - 3} certificaciones más en esta categoría
                                                    </li>
                                                )}
                                            </ul>
                                        ) : (
                                            <span className="text-slate-400 italic">
                                                Aún no hay certificaciones asociadas a esta categoría.
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
