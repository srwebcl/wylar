'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import { saveHeroSlide } from '@/actions/hero';

export interface HeroSlideFormInitial {
    id?: number;
    order: number;
    active: boolean;
    image: string;
    eyebrowLead: string;
    eyebrowAccent: string;
    title: string;
    titleHighlight: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
}

const FIELD_CLASS = 'w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40]';
const LABEL_CLASS = 'block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider';

export function HeroSlideForm({ initial }: { initial?: HeroSlideFormInitial }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [active, setActive] = useState(initial?.active ?? true);
    const [image, setImage] = useState(initial?.image ?? '');
    const [eyebrowLead, setEyebrowLead] = useState(initial?.eyebrowLead ?? 'Centro Acreditado');
    const [eyebrowAccent, setEyebrowAccent] = useState(initial?.eyebrowAccent ?? 'ChileValora');
    const [title, setTitle] = useState(initial?.title ?? '');
    const [titleHighlight, setTitleHighlight] = useState(initial?.titleHighlight ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? '');
    const [ctaHref, setCtaHref] = useState(initial?.ctaHref ?? '/catalogo');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const result = await saveHeroSlide(
                { order: initial?.order ?? 0, active, image, eyebrowLead, eyebrowAccent, title, titleHighlight, description, ctaLabel, ctaHref },
                initial?.id ?? null,
            );
            if (result.error) setError(result.error);
            else router.push('/hero');
        });
    }

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5 max-w-2xl">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Activo (se muestra en wylar.cl)
            </label>

            <div>
                <label className={LABEL_CLASS}>Imagen (ruta o URL)</label>
                <input value={image} onChange={(e) => setImage(e.target.value)} required placeholder="/images/hero_principal.jpg" className={FIELD_CLASS} />
                <p className="text-xs text-slate-400 mt-1">Misma carpeta pública del sitio (/images/...) o una URL completa.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Etiqueta — texto</label>
                    <input value={eyebrowLead} onChange={(e) => setEyebrowLead(e.target.value)} required placeholder="Centro Acreditado" className={FIELD_CLASS} />
                </div>
                <div>
                    <label className={LABEL_CLASS}>Etiqueta — destacado</label>
                    <input value={eyebrowAccent} onChange={(e) => setEyebrowAccent(e.target.value)} required placeholder="ChileValora" className={FIELD_CLASS} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Título</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Certificamos tus" className={FIELD_CLASS} />
                </div>
                <div>
                    <label className={LABEL_CLASS}>Título — parte destacada</label>
                    <input value={titleHighlight} onChange={(e) => setTitleHighlight(e.target.value)} required placeholder="competencias laborales." className={FIELD_CLASS} />
                </div>
            </div>

            <div>
                <label className={LABEL_CLASS}>Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className={FIELD_CLASS} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Texto del botón</label>
                    <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} required placeholder="Quiero Certificarme" className={FIELD_CLASS} />
                </div>
                <div>
                    <label className={LABEL_CLASS}>Destino del botón</label>
                    <input value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} required placeholder="/catalogo" className={FIELD_CLASS} />
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{error}</div>}

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <button type="submit" disabled={isPending} className="flex items-center gap-2 bg-[#0B1E40] hover:bg-[#122b59] text-white font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                    <Save size={16} /> {isPending ? 'Guardando...' : 'Guardar slide'}
                </button>
                <button type="button" onClick={() => router.push('/hero')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-4 py-2.5">
                    <ArrowLeft size={16} /> Cancelar
                </button>
            </div>
        </form>
    );
}
