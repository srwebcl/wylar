'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Pencil, Trash2, Power, ArrowUp, ArrowDown, ImageOff } from 'lucide-react';
import { deleteHeroSlide, toggleHeroSlideActive, reorderHeroSlide } from '@/actions/hero';

interface Row {
    id: number;
    image: string;
    title: string;
    titleHighlight: string;
    active: boolean;
}

const SITE_ORIGIN = 'https://wylar.vercel.app';

/** Las rutas relativas (ej. /images/foo.jpg) son del sitio wylar.cl, no del CRM — hay que resolverlas contra ese dominio para previsualizarlas acá. */
function previewSrc(image: string): string {
    return image.startsWith('/') ? `${SITE_ORIGIN}${image}` : image;
}

export function HeroSlideTable({ slides }: { slides: Row[] }) {
    const [, startTransition] = useTransition();

    function handleDelete(id: number, title: string) {
        if (!confirm(`¿Eliminar el slide "${title}"? Esta acción no se puede deshacer.`)) return;
        startTransition(() => {
            void deleteHeroSlide(id);
        });
    }

    if (slides.length === 0) {
        return (
            <div className="glass-card p-10 text-center text-slate-400">
                Aún no hay slides personalizados. Mientras tanto, el hero de wylar.cl muestra un slide de respaldo fijo.
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                        <th className="px-5 py-3">Orden</th>
                        <th className="px-5 py-3">Slide</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {slides.map((s, index) => (
                        <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5">
                                <div className="flex items-center gap-1">
                                    <button
                                        disabled={index === 0}
                                        onClick={() => startTransition(() => reorderHeroSlide(s.id, 'up'))}
                                        className="p-1.5 text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-colors"
                                        title="Subir"
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button
                                        disabled={index === slides.length - 1}
                                        onClick={() => startTransition(() => reorderHeroSlide(s.id, 'down'))}
                                        className="p-1.5 text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-colors"
                                        title="Bajar"
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                </div>
                            </td>
                            <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                                        {s.image ? <img src={previewSrc(s.image)} alt="" className="w-full h-full object-cover" /> : <ImageOff size={16} className="text-slate-300" />}
                                    </div>
                                    <p className="font-bold text-slate-900">
                                        {s.title} <span className="text-slate-500 font-medium">{s.titleHighlight}</span>
                                    </p>
                                </div>
                            </td>
                            <td className="px-5 py-3.5">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {s.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td className="px-5 py-3.5">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => startTransition(() => toggleHeroSlideActive(s.id))}
                                        className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                                        title={s.active ? 'Desactivar' : 'Activar'}
                                    >
                                        <Power size={16} />
                                    </button>
                                    <Link href={`/hero/${s.id}`} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Editar">
                                        <Pencil size={16} />
                                    </Link>
                                    <button onClick={() => handleDelete(s.id, s.title)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Eliminar">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
