'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Power, Settings, X, Globe, ExternalLink, Search } from 'lucide-react';
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
    slug?: string;
    active?: boolean;
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
    profileTitle?: string | null;
    profileSlug?: string | null;
    profileActive?: boolean | null;
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
    profiles,
    isAdmin,
}: {
    products: ProductRow[];
    categories: CategoryRow[];
    profiles: ProfileRow[];
    isAdmin: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Filtros y búsqueda
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [webFilter, setWebFilter] = useState<'ALL' | 'WITH_WEB' | 'CRM_ONLY'>('ALL');

    // Campos del formulario
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0);
    const [profileId, setProfileId] = useState('');
    const [attributes, setAttributes] = useState<Record<string, string>>({});

    const category = categories.find((c) => c.id === categoryId);
    const attributeFields = category ? attributeFieldsFor(category.attributeTemplate) : [];

    // Estadísticas
    const stats = useMemo(() => {
        const total = products.length;
        const withWeb = products.filter((p) => p.profileId != null).length;
        const crmOnly = total - withWeb;
        const active = products.filter((p) => p.active).length;
        return { total, withWeb, crmOnly, active };
    }, [products]);

    // Filtrado interactivo
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchName = p.name.toLowerCase().includes(q);
                const matchDesc = p.description?.toLowerCase().includes(q) ?? false;
                const matchCat = p.categoryName.toLowerCase().includes(q);
                const matchProfile = p.profileTitle?.toLowerCase().includes(q) ?? false;
                if (!matchName && !matchDesc && !matchCat && !matchProfile) return false;
            }
            if (selectedCategory !== 'ALL' && String(p.categoryId) !== selectedCategory) {
                return false;
            }
            if (webFilter === 'WITH_WEB' && p.profileId == null) {
                return false;
            }
            if (webFilter === 'CRM_ONLY' && p.profileId != null) {
                return false;
            }
            return true;
        });
    }, [products, search, selectedCategory, webFilter]);

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
            setSuccess(result.success ?? 'Servicio guardado exitosamente.');
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
            {/* Encabezado */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Catálogo de Servicios</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Catálogo comercial maestro — cursos, certificaciones y calificaciones para cotizar y registrar oportunidades.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Link
                        href="/productos/categorias"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm"
                    >
                        <Settings size={16} className="text-slate-500" /> Categorías
                    </Link>
                    <button
                        onClick={openCreateForm}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
                    >
                        <Plus size={18} /> Nuevo servicio
                    </button>
                </div>
            </div>

            {/* Tarjetas resumen de estado comercial */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="glass-card bg-white p-4 border border-slate-200/80 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Servicios</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stats.active} activos comercialmente</p>
                </div>
                <div className="glass-card bg-white p-4 border border-slate-200/80 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Publicados en Web</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{stats.withWeb}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Con ficha de marketing en wylar.cl</p>
                </div>
                <div className="glass-card bg-white p-4 border border-slate-200/80 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solo CRM / Privados</p>
                    <p className="text-2xl font-black text-slate-700 mt-1">{stats.crmOnly}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Venta directa sin landing pública</p>
                </div>
                <div className="glass-card bg-white p-4 border border-slate-200/80 rounded-xl flex flex-col justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fichas Web</p>
                        <p className="text-xs text-slate-600 mt-1">Edita textos y fotos que ve el público</p>
                    </div>
                    <Link
                        href="/catalogo"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors mt-2"
                    >
                        Administrar fichas web <ExternalLink size={12} />
                    </Link>
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

            {/* Barra de filtros y búsqueda */}
            <div className="glass-card bg-white p-3.5 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, categoría o ficha web..."
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white text-slate-900 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full py-2 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                        >
                            <option value="ALL">Todas las categorías</option>
                            {categories.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative flex-1 sm:w-44">
                        <select
                            value={webFilter}
                            onChange={(e) => setWebFilter(e.target.value as any)}
                            className="w-full py-2 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                        >
                            <option value="ALL">Todo el catálogo</option>
                            <option value="WITH_WEB">Publicados en Web</option>
                            <option value="CRM_ONLY">Solo CRM (Privados)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Modal de creación / edición */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
                    <form
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 rounded-2xl shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h2 className="font-extrabold text-slate-900 text-lg">
                                    {editingId != null ? 'Editar servicio del catálogo' : 'Nuevo servicio en el catálogo'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Disponible inmediatamente para oportunidades y cotizaciones del CRM.
                                </p>
                            </div>
                            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Cerrar">
                                <X size={20} />
                            </button>
                        </div>

                        {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

                        <div className="space-y-3.5">
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Categoría comercial</span>
                                <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className={inputClass} required>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Nombre del servicio / curso</span>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Soldador Calificado 3G / Cuidador de Personas Mayores"
                                    className={inputClass}
                                    required
                                />
                            </label>

                            <label className="block">
                                <span className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Descripción comercial (opcional)</span>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    placeholder="Resumen o alcance que verá el vendedor en el CRM..."
                                    className={inputClass}
                                />
                            </label>

                            <label className="block">
                                <span className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Precio de referencia base (CLP, opcional)</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="Dejar vacío si es 'A cotizar'"
                                    className={inputClass}
                                />
                            </label>

                            {/* Ficha Web vinculada */}
                            <div className="p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-xl space-y-2">
                                <div className="flex items-center gap-2">
                                    <Globe size={16} className="text-blue-700" />
                                    <span className="text-xs font-bold text-[#0B1E40] uppercase tracking-wide">
                                        Ficha Web pública en wylar.cl
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600">
                                    Vincula este servicio a su landing page de marketing en el sitio web para sincronizar consultas y cotizaciones entrantes.
                                </p>
                                <select value={profileId} onChange={(e) => setProfileId(e.target.value)} className={inputClass}>
                                    <option value="">-- Ninguna (Solo CRM / Venta privada sin web) --</option>
                                    {profiles.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.title} {p.slug ? `(/perfil/${p.slug})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {attributeFields.length > 0 && (
                                <div className="space-y-3 border-t border-slate-100 pt-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Atributos específicos de {category?.name}</p>
                                    {attributeFields.map((f) => (
                                        <label key={f.key} className="block">
                                            <span className="block text-xs font-bold text-slate-600 mb-1">{f.label}</span>
                                            {f.type === 'select' ? (
                                                <select
                                                    value={attributes[f.key] ?? ''}
                                                    onChange={(e) => setAttributes((a) => ({ ...a, [f.key]: e.target.value }))}
                                                    className={inputClass}
                                                >
                                                    <option value="">— Seleccionar —</option>
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
                                {isPending ? 'Guardando…' : editingId != null ? 'Guardar cambios' : 'Crear en catálogo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Listado de servicios */}
            <div className="space-y-3">
                {/* Vista móvil: tarjetas táctiles */}
                <div className="block lg:hidden space-y-3">
                    {filteredProducts.map((p) => (
                        <div key={p.id} className={`glass-card bg-white p-4 space-y-3 border border-slate-200/80 rounded-xl ${p.active ? '' : 'opacity-65'}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                    <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                            {p.categoryName}
                                        </span>
                                        <span className="text-xs font-extrabold text-[#0B1E40]">{money(p.price)}</span>
                                    </div>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {p.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            {/* Estado web */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">Presencia web:</span>
                                {p.profileId != null ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                            <Globe size={11} /> wylar.cl
                                        </span>
                                        <Link
                                            href={`/catalogo/${p.profileId}`}
                                            className="text-[11px] font-bold text-amber-700 hover:underline inline-flex items-center gap-0.5"
                                        >
                                            Editar web <ExternalLink size={10} />
                                        </Link>
                                    </div>
                                ) : (
                                    <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                                        Solo CRM (Privado)
                                    </span>
                                )}
                            </div>

                            {/* Acciones */}
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
                                        disabled={isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Power size={13} /> {p.active ? 'Desactivar' : 'Activar'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div className="glass-card bg-white p-8 text-center text-slate-400 text-sm border border-slate-200 rounded-xl">
                            No se encontraron servicios con los filtros seleccionados.
                        </div>
                    )}
                </div>

                {/* Vista desktop: tabla */}
                <div className="hidden lg:block glass-card bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/90 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-5 py-3.5">Servicio / Certificación</th>
                                    <th className="px-5 py-3.5">Categoría</th>
                                    <th className="px-5 py-3.5">Precio base</th>
                                    <th className="px-5 py-3.5">Ficha Web (wylar.cl)</th>
                                    <th className="px-5 py-3.5">Estado</th>
                                    <th className="px-5 py-3.5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map((p) => (
                                    <tr key={p.id} className={`hover:bg-slate-50/70 transition-colors ${p.active ? '' : 'opacity-60 bg-slate-50/30'}`}>
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
                                        <td className="px-5 py-3.5 font-bold text-slate-800">
                                            {money(p.price)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {p.profileId != null ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                                                            <Globe size={12} className="text-blue-600" /> Publicado en Web
                                                        </span>
                                                        <Link
                                                            href={`/catalogo/${p.profileId}`}
                                                            className="text-xs text-amber-700 hover:text-amber-900 font-bold inline-flex items-center gap-0.5 hover:underline"
                                                            title="Editar textos, imágenes y bloques de marketing"
                                                        >
                                                            Editar ficha <ExternalLink size={11} />
                                                        </Link>
                                                    </div>
                                                    {p.profileTitle && (
                                                        <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">
                                                            {p.profileTitle}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                                        Solo CRM (Privado)
                                                    </span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => openEditForm(p)}
                                                            className="text-xs text-slate-500 hover:text-blue-700 font-semibold underline decoration-dotted"
                                                        >
                                                            + Asociar web
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-100 text-slate-500'}`}>
                                                {p.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => openEditForm(p)}
                                                            className="p-2 text-slate-400 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors"
                                                            title="Editar servicio"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggle(p.id)}
                                                            disabled={isPending}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title={p.active ? 'Desactivar para cotizaciones nuevas' : 'Activar'}
                                                        >
                                                            <Power size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                                            No se encontraron servicios registrados con los filtros actuales.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
