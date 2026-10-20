'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { deleteProfile } from '@/actions/catalog';

interface Row {
    id: number;
    slug: string;
    title: string;
    category: string;
    templateLabel: string;
    isFeatured: boolean;
    active: boolean;
}

export function CatalogTable({ profiles, isAdmin }: { profiles: Row[]; isAdmin: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [pendingId, setPendingId] = useState<number | null>(null);

    function handleDelete(id: number, title: string) {
        if (!confirm(`¿Eliminar el perfil "${title}" del catálogo? Esta acción no se puede deshacer.`)) return;
        setPendingId(id);
        startTransition(async () => {
            await deleteProfile(id);
            setPendingId(null);
        });
    }

    if (profiles.length === 0) {
        return <div className="glass-card p-10 text-center text-slate-400">Aún no hay perfiles en el catálogo. Crea el primero.</div>;
    }

    return (
        <div className="space-y-3">
            {/* Vista móvil: tarjetas táctiles */}
            <div className="block sm:hidden space-y-3">
                {profiles.map((p) => (
                    <div key={p.id} className="glass-card bg-white p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-bold text-slate-900">{p.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{p.category}</p>
                            </div>
                            <div className="flex gap-1.5 flex-wrap justify-end">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {p.active ? 'Activo' : 'Inactivo'}
                                </span>
                                {p.isFeatured && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Destacado</span>}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <a
                                href={`/api/public/catalog?slug=${p.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                            >
                                <ExternalLink size={14} /> JSON
                            </a>
                            <Link
                                href={`/catalogo/${p.id}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0B1E40] bg-amber-100/60 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                            >
                                <Pencil size={14} /> Editar
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
            </div>

            {/* Vista desktop: tabla */}
            <div className="hidden sm:block glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                                <th className="px-5 py-3">Perfil</th>
                                <th className="px-5 py-3">Categoría</th>
                                <th className="px-5 py-3">Estado</th>
                                <th className="px-5 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map((p) => (
                                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <p className="font-bold text-slate-900">{p.title}</p>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600">{p.category}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex gap-1.5 flex-wrap">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {p.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                            {p.isFeatured && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Destacado</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <a
                                                href={`/api/public/catalog?slug=${p.slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 text-slate-400 hover:text-cyan-700 transition-colors"
                                                title="Ver JSON público"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            <Link href={`/catalogo/${p.id}`} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Editar">
                                                <Pencil size={16} />
                                            </Link>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(p.id, p.title)}
                                                    disabled={isPending && pendingId === p.id}
                                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                    title="Eliminar (solo administradores)"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
