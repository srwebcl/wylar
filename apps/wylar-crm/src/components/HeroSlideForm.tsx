'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import { saveHeroSlide } from '@/actions/hero';
import { ImageUploadField } from '@/components/ImageUploadField';

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
const INTERNAL_PAGES = [
    { label: 'Catálogo Principal', value: '/catalogo' },
    { label: 'Home - Portales', value: '/#portales' },
    { label: 'Empresas', value: '/empresas' },
    { label: 'Instituciones', value: '/instituciones' },
    { label: 'Contacto', value: '/contacto' },
    { label: 'Portal ChileValora', value: '/chilevalora' }
];

export function HeroSlideForm({ initial, profiles = [] }: { initial?: HeroSlideFormInitial, profiles?: { id: number, title: string, link: string }[] }) {
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

    const [linkType, setLinkType] = useState(() => {
        if (!initial?.ctaHref) return 'internal';
        if (INTERNAL_PAGES.some(p => p.value === initial.ctaHref)) return 'internal';
        if (profiles.some(p => p.link === initial.ctaHref)) return 'profile';
        return 'custom';
    });

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
                <label className={LABEL_CLASS}>Imagen del Banner</label>
                <ImageUploadField value={image} onChange={setImage} />
                <p className="text-xs text-slate-400 mt-2">Sube una imagen. Se guardará en la carpeta pública del CRM y se compartirá con la web.</p>
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
                    <label className={LABEL_CLASS}>Tipo de enlace</label>
                    <select 
                        value={linkType} 
                        onChange={(e) => {
                            setLinkType(e.target.value);
                            setCtaHref('');
                        }}
                        className={FIELD_CLASS}
                    >
                        <option value="internal">Página Interna</option>
                        <option value="profile">Perfil del Catálogo</option>
                        <option value="custom">URL Personalizada</option>
                    </select>
                </div>
                <div className="col-span-2">
                    <label className={LABEL_CLASS}>Destino seleccionado</label>
                    {linkType === 'internal' && (
                        <select value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} className={FIELD_CLASS} required>
                            <option value="" disabled>Selecciona una página interna...</option>
                            {INTERNAL_PAGES.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    )}
                    {linkType === 'profile' && (
                        <select value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} className={FIELD_CLASS} required>
                            <option value="" disabled>Selecciona un perfil...</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.link}>{p.title}</option>
                            ))}
                        </select>
                    )}
                    {linkType === 'custom' && (
                        <input value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} required placeholder="https://..." className={FIELD_CLASS} />
                    )}
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
