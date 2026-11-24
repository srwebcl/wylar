'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import { savePopup } from '@/actions/popups';
import { PopupImageUploadField } from '@/components/PopupImageUploadField';
import { Select } from '@/components/ui/Select';
import { SITE_PAGES } from '@/lib/sitePages';

type LinkType = 'NONE' | 'INTERNAL' | 'EXTERNAL';

export interface PopupFormInitial {
    id?: number;
    title: string;
    active: boolean;
    image: string;
    imageWidth: number | null;
    imageHeight: number | null;
    linkType: LinkType;
    linkHref: string | null;
    showOnAllPages: boolean;
    pages: string[];
    showOnProfilePages: boolean;
}

const LABEL_CLASS = 'block text-sm font-medium text-slate-700 mb-1.5';
const FIELD_CLASS = 'w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40]';

export function PopupForm({ initial, profiles = [] }: { initial?: PopupFormInitial; profiles?: { id: number; title: string; link: string }[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState(initial?.title ?? '');
    const [active, setActive] = useState(initial?.active ?? true);
    const [image, setImage] = useState(initial?.image ?? '');
    const [imageWidth, setImageWidth] = useState<number | null>(initial?.imageWidth ?? null);
    const [imageHeight, setImageHeight] = useState<number | null>(initial?.imageHeight ?? null);

    const [linkType, setLinkType] = useState<LinkType>(initial?.linkType ?? 'NONE');
    const [linkHref, setLinkHref] = useState(initial?.linkHref ?? '');
    // Submodo del enlace interno: página fija del sitio o una ficha de perfil puntual.
    const [internalMode, setInternalMode] = useState<'page' | 'profile'>(() => {
        if (!initial?.linkHref) return 'page';
        return profiles.some((p) => p.link === initial.linkHref) ? 'profile' : 'page';
    });

    const [showOnAllPages, setShowOnAllPages] = useState(initial?.showOnAllPages ?? true);
    const [pages, setPages] = useState<string[]>(initial?.pages ?? []);
    const [showOnProfilePages, setShowOnProfilePages] = useState(initial?.showOnProfilePages ?? false);

    const pageOptions = useMemo(() => SITE_PAGES.map((p) => ({ value: p.value, label: p.label })), []);

    function togglePage(value: string) {
        setPages((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const result = await savePopup(
                {
                    title,
                    active,
                    image,
                    imageWidth,
                    imageHeight,
                    linkType,
                    linkHref: linkType === 'NONE' ? null : linkHref,
                    showOnAllPages,
                    pages: showOnAllPages ? [] : pages,
                    showOnProfilePages: showOnAllPages ? false : showOnProfilePages,
                },
                initial?.id ?? null,
            );
            if (result.error) setError(result.error);
            else router.push('/popups');
        });
    }

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5 max-w-2xl">
            <div>
                <label className={LABEL_CLASS}>Nombre interno</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Ej: Promoción curso soldadura noviembre"
                    className={FIELD_CLASS}
                />
                <p className="text-xs text-slate-400 mt-1">Solo para identificarlo en este listado — nunca se muestra en el sitio.</p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Activo (se muestra en wylar.cl)
            </label>

            <div>
                <label className={LABEL_CLASS}>Imagen del pop-up</label>
                <PopupImageUploadField
                    value={image}
                    onChange={(url, width, height) => {
                        setImage(url);
                        setImageWidth(width);
                        setImageHeight(height);
                    }}
                />
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
                <div>
                    <label className={LABEL_CLASS}>Enlace al hacer clic</label>
                    <Select
                        value={linkType}
                        onChange={(v) => {
                            setLinkType(v as LinkType);
                            setLinkHref('');
                        }}
                        options={[
                            { value: 'NONE', label: 'Sin enlace (solo informativo)' },
                            { value: 'INTERNAL', label: 'Página del sitio' },
                            { value: 'EXTERNAL', label: 'URL externa' },
                        ]}
                    />
                </div>

                {linkType === 'INTERNAL' && (
                    <div className="space-y-3">
                        <Select
                            value={internalMode}
                            onChange={(v) => {
                                setInternalMode(v as 'page' | 'profile');
                                setLinkHref('');
                            }}
                            options={[
                                { value: 'page', label: 'Página fija del sitio' },
                                { value: 'profile', label: 'Ficha de certificación' },
                            ]}
                        />
                        {internalMode === 'page' ? (
                            <Select value={linkHref} onChange={setLinkHref} placeholder="Selecciona una página..." options={pageOptions} />
                        ) : (
                            <Select
                                value={linkHref}
                                onChange={setLinkHref}
                                placeholder="Selecciona una ficha..."
                                options={profiles.map((p) => ({ value: p.link, label: p.title }))}
                            />
                        )}
                    </div>
                )}

                {linkType === 'EXTERNAL' && (
                    <input value={linkHref} onChange={(e) => setLinkHref(e.target.value)} required placeholder="https://..." className={FIELD_CLASS} />
                )}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
                <label className={LABEL_CLASS}>¿Dónde se muestra?</label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={showOnAllPages} onChange={(e) => setShowOnAllPages(e.target.checked)} /> Mostrar en todo el sitio
                </label>

                {!showOnAllPages && (
                    <div className="space-y-3 pl-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                            {SITE_PAGES.map((p) => (
                                <label key={p.value} className="flex items-center gap-2 text-sm text-slate-600">
                                    <input type="checkbox" checked={pages.includes(p.value)} onChange={() => togglePage(p.value)} /> {p.label}
                                </label>
                            ))}
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600 pt-2 border-t border-slate-100">
                            <input type="checkbox" checked={showOnProfilePages} onChange={(e) => setShowOnProfilePages(e.target.checked)} />
                            Incluir todas las fichas de certificación (/perfil/*)
                        </label>
                    </div>
                )}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{error}</div>}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-100">
                <button
                    type="submit"
                    disabled={isPending || !image}
                    className="flex items-center justify-center gap-2 bg-[#0B1E40] hover:bg-[#122b59] text-white font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 w-full sm:w-auto"
                >
                    <Save size={16} /> {isPending ? 'Guardando...' : 'Guardar pop-up'}
                </button>
                <button
                    type="button"
                    onClick={() => router.push('/popups')}
                    className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-4 py-2.5 w-full sm:w-auto"
                >
                    <ArrowLeft size={16} /> Cancelar
                </button>
            </div>
        </form>
    );
}
