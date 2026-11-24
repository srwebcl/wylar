'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Pencil, Trash2, Power, ExternalLink, ImageOff } from 'lucide-react';
import { deletePopup, togglePopupActive } from '@/actions/popups';
import { SITE_PAGES } from '@/lib/sitePages';

interface Row {
    id: number;
    title: string;
    image: string;
    active: boolean;
    linkType: 'NONE' | 'INTERNAL' | 'EXTERNAL';
    linkHref: string | null;
    showOnAllPages: boolean;
    pages: string[];
    showOnProfilePages: boolean;
}

function pageLabel(value: string): string {
    return SITE_PAGES.find((p) => p.value === value)?.label ?? value;
}

function whereText(p: Row): string {
    if (p.showOnAllPages) return 'Todo el sitio';
    const parts = p.pages.map(pageLabel);
    if (p.showOnProfilePages) parts.push('Fichas de certificación');
    return parts.length > 0 ? parts.join(', ') : 'Sin páginas seleccionadas';
}

function linkText(p: Row): string {
    if (p.linkType === 'NONE' || !p.linkHref) return 'Sin enlace';
    return p.linkHref;
}

export function PopupTable({ popups, isAdmin }: { popups: Row[]; isAdmin: boolean }) {
    const [isPending, startTransition] = useTransition();

    function handleDelete(id: number, title: string) {
        if (!confirm(`¿Eliminar el pop-up "${title}"? Esta acción no se puede deshacer.`)) return;
        startTransition(() => {
            void deletePopup(id);
        });
    }

    if (popups.length === 0) {
        return (
            <div className="glass-card p-10 text-center text-slate-400">Aún no hay pop-ups creados.</div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Vista móvil: tarjetas */}
            <div className="block sm:hidden space-y-3">
                {popups.map((p) => (
                    <div key={p.id} className="glass-card bg-white p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                                {p.image ? <img src={p.image} alt="" className="w-full h-full object-contain" /> : <ImageOff size={16} className="text-slate-300" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 text-sm truncate">{p.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{whereText(p)}</p>
                                <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {p.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                            <button onClick={() => startTransition(() => togglePopupActive(p.id))} className="p-2 text-slate-400 hover:text-amber-600 transition-colors" title={p.active ? 'Desactivar' : 'Activar'}>
                                <Power size={16} />
                            </button>
                            <Link href={`/popups/${p.id}`} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Editar">
                                <Pencil size={16} />
                            </Link>
                            {isAdmin && (
                                <button onClick={() => handleDelete(p.id, p.title)} disabled={isPending} className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50" title="Eliminar">
                                    <Trash2 size={16} />
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
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                                <th className="px-5 py-3">Pop-up</th>
                                <th className="px-5 py-3">Dónde se muestra</th>
                                <th className="px-5 py-3">Enlace</th>
                                <th className="px-5 py-3">Estado</th>
                                <th className="px-5 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {popups.map((p) => (
                                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                                                {p.image ? <img src={p.image} alt="" className="w-full h-full object-contain" /> : <ImageOff size={16} className="text-slate-300" />}
                                            </div>
                                            <p className="font-bold text-slate-900">{p.title}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[220px]">{whereText(p)}</td>
                                    <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[200px] truncate">
                                        {p.linkType === 'EXTERNAL' ? (
                                            <span className="inline-flex items-center gap-1">
                                                {linkText(p)} <ExternalLink size={11} className="shrink-0" />
                                            </span>
                                        ) : (
                                            linkText(p)
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {p.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => startTransition(() => togglePopupActive(p.id))}
                                                className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                                                title={p.active ? 'Desactivar' : 'Activar'}
                                            >
                                                <Power size={16} />
                                            </button>
                                            <Link href={`/popups/${p.id}`} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Editar">
                                                <Pencil size={16} />
                                            </Link>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(p.id, p.title)}
                                                    disabled={isPending}
                                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                    title="Eliminar"
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
