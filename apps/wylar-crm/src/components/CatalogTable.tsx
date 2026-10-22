'use client';

import Link from 'next/link';
import { useState, useTransition, useMemo } from 'react';
import { Pencil, Trash2, ExternalLink, Package, Search, Globe } from 'lucide-react';
import { deleteProfile } from '@/actions/catalog';

interface LinkedProduct {
    id: number;
    name: string;
    categoryName: string;
    price: number | null;
}

interface Row {
    id: number;
    slug: string;
    title: string;
    category: string;
    templateLabel: string;
    isFeatured: boolean;
    active: boolean;
    linkedProduct: LinkedProduct | null;
}

function money(value: number | null) {
    if (value == null) return 'A cotizar';
    return `$${Math.round(value).toLocaleString('es-CL')}`;
}

export function CatalogTable({ profiles, isAdmin }: { profiles: Row[]; isAdmin: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const filteredProfiles = useMemo(() => {
        if (!search.trim()) return profiles;
        const q = search.toLowerCase();
        return profiles.filter((p) => {
            const matchTitle = p.title.toLowerCase().includes(q);
            const matchSlug = p.slug.toLowerCase().includes(q);
            const matchCategory = p.category.toLowerCase().includes(q);
            const matchProduct = p.linkedProduct?.name.toLowerCase().includes(q) ?? false;
            return matchTitle || matchSlug || matchCategory || matchProduct;
        });
    }, [profiles, search]);

    function handleDelete(id: number, title: string) {
        if (!confirm(`¿Eliminar la ficha web "${title}" de wylar.cl? Esta acción no se puede deshacer.`)) return;
        setPendingId(id);
        startTransition(async () => {
            await deleteProfile(id);
            setPendingId(null);
        });
    }

    if (profiles.length === 0) {
        return (
            <div className="glass-card bg-white p-12 text-center text-slate-400 border border-slate-200 rounded-2xl shadow-sm">
                <Globe size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-slate-700 text-base">Aún no hay fichas web publicadas</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Crea la primera ficha para exhibir tus servicios y certificaciones en wylar.cl.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Barra de búsqueda */}
            <div className="glass-card bg-white p-3 border border-slate-200 rounded-xl flex items-center gap-3">
                <Search size={16} className="text-slate-400 ml-1 shrink-0" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por título, categoría web o servicio vinculado..."
                    className="w-full text-sm bg-transparent border-0 focus:outline-none text-slate-900 placeholder:text-slate-400"
                />
            </div>

            {/* Vista móvil: tarjetas táctiles */}
            <div className="block lg:hidden space-y-3">
                {filteredProfiles.map((p) => (
                    <div key={p.id} className="glass-card bg-white p-4 space-y-3 border border-slate-200/90 rounded-xl shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                                <p className="font-bold text-slate-900 text-sm">{p.title}</p>
                                <p className="text-xs text-slate-500 font-mono">/perfil/{p.slug}</p>
                            </div>
                            <div className="flex gap-1.5 flex-wrap justify-end">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {p.active ? 'Activo' : 'Inactivo'}
                                </span>
                                {p.isFeatured && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Destacado</span>}
                            </div>
                        </div>

                        {/* Catálogo vinculado */}
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Servicio en Catálogo CRM</p>
                            {p.linkedProduct ? (
                                <div className="flex items-center gap-1.5 text-xs text-slate-800">
                                    <Package size={13} className="text-amber-600 shrink-0" />
                                    <span className="font-semibold">{p.linkedProduct.name}</span>
                                    <span className="text-slate-400">·</span>
                                    <span className="text-slate-500">{money(p.linkedProduct.price)}</span>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">Sin vincular al catálogo comercial</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <a
                                href={`/api/public/catalog?slug=${p.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                            >
                                <ExternalLink size={13} /> JSON
                            </a>
                            <Link
                                href={`/catalogo/${p.id}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0B1E40] bg-amber-100/60 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                            >
                                <Pencil size={13} /> Editar ficha
                            </Link>
                            {isAdmin && (
                                <button
                                    onClick={() => handleDelete(p.id, p.title)}
                                    disabled={isPending && pendingId === p.id}
                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                    title="Eliminar"
                                >
                                    <Trash2 size={15} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {filteredProfiles.length === 0 && (
                    <div className="glass-card bg-white p-8 text-center text-slate-400 text-sm border border-slate-200 rounded-xl">
                        No se encontraron fichas web con el criterio de búsqueda.
                    </div>
                )}
            </div>

            {/* Vista desktop: tabla */}
            <div className="hidden lg:block glass-card bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3.5">Ficha Web (wylar.cl)</th>
                                <th className="px-5 py-3.5">Categoría Web</th>
                                <th className="px-5 py-3.5">Ítem Catálogo CRM (Comercial)</th>
                                <th className="px-5 py-3.5">Estado</th>
                                <th className="px-5 py-3.5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProfiles.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <p className="font-bold text-slate-900">{p.title}</p>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">/perfil/{p.slug}</p>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600">
                                        <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                                            {p.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {p.linkedProduct ? (
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                                    <Package size={13} className="text-amber-600 shrink-0" />
                                                    <span>{p.linkedProduct.name}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium">
                                                    {p.linkedProduct.categoryName} · {money(p.linkedProduct.price)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                <span className="inline-block w-2 h-2 rounded-full bg-slate-300"></span>
                                                <span>Solo web (sin producto CRM asociado)</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex gap-1.5 flex-wrap">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-100 text-slate-500'}`}>
                                                {p.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                            {p.isFeatured && (
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
                                                    Destacado
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <a
                                                href={`/api/public/catalog?slug=${p.slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 text-slate-400 hover:text-cyan-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Ver JSON público"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            <Link
                                                href={`/catalogo/${p.id}`}
                                                className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Editar contenido de la ficha web"
                                            >
                                                <Pencil size={16} />
                                            </Link>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(p.id, p.title)}
                                                    disabled={isPending && pendingId === p.id}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Eliminar de la web"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredProfiles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">
                                        No se encontraron fichas web con el criterio de búsqueda.
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
