'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import clsx from 'clsx';
import { saveProfile } from '@/actions/catalog';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ImageUploadField } from '@/components/ImageUploadField';
import { slugify } from '@/lib/slugify';
import { ESTANDAR_SECTION_KEYS, ESTANDAR_SECTION_LABELS } from '@/lib/catalogSpec';

type SectionKey = (typeof ESTANDAR_SECTION_KEYS)[number];

export interface ProfileWizardInitial {
    id?: number;
    slug: string;
    title: string;
    description: string;
    descriptionLong: string;
    image: string;
    category: string;
    sector: string;
    subsector: string;
    nivel: string;
    vigencia: string;
    target: string[];
    isChileValora: boolean;
    isFeatured: boolean;
    active: boolean;
    sections: Record<SectionKey, string>;
    faqs: { question: string; answer: string }[];
}

const EMPTY_SECTIONS: Record<SectionKey, string> = Object.fromEntries(ESTANDAR_SECTION_KEYS.map((k) => [k, ''])) as Record<SectionKey, string>;

const FIELD_CLASS = 'w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40]';
const LABEL_CLASS = 'block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider';

export function ProfileWizard({ initial }: { initial?: ProfileWizardInitial }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState(initial?.title ?? '');
    const [slug, setSlug] = useState(initial?.slug ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [descriptionLong, setDescriptionLong] = useState(initial?.descriptionLong ?? '');
    const [image, setImage] = useState(initial?.image ?? '');
    
    // Valores por defecto ocultos
    const category = initial?.category || 'General';
    const sector = initial?.sector || 'General';
    const subsector = initial?.subsector || 'General';
    const nivel = initial?.nivel || 'General';
    const vigencia = initial?.vigencia || '';
    const target = initial?.target?.length ? initial.target : ['personas'];

    const [isChileValora, setIsChileValora] = useState(initial?.isChileValora ?? true);
    const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
    const [active, setActive] = useState(initial?.active ?? true);
    
    const [sections, setSections] = useState<Record<SectionKey, string>>(initial?.sections ?? EMPTY_SECTIONS);
    const [faqs, setFaqs] = useState(initial?.faqs ?? []);

    function handleTitleChange(value: string) {
        setTitle(value);
        if (!initial?.id) setSlug(slugify(value));
    }

    function updateSection(key: SectionKey, html: string) {
        setSections((prev) => ({ ...prev, [key]: html }));
    }

    function addFaq() {
        setFaqs((prev) => [...prev, { question: '', answer: '' }]);
    }
    
    function updateFaq(index: number, patch: Partial<{ question: string; answer: string }>) {
        setFaqs((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    }
    
    function removeFaq(index: number) {
        setFaqs((prev) => prev.filter((_, i) => i !== index));
    }

    function handleSave() {
        if (!title.trim()) return setError('Falta el nombre de la certificación.');
        if (!description.trim()) return setError('Falta la descripción corta.');
        if (!image) return setError('Falta subir una imagen para la certificación.');

        setError(null);
        startTransition(async () => {
            const result = await saveProfile(
                {
                    slug: slug || slugify(title),
                    templateType: 'ESTANDAR',
                    title,
                    description,
                    image,
                    category,
                    sector,
                    subsector,
                    nivel,
                    vigencia: vigencia || null,
                    target,
                    isChileValora,
                    isFeatured,
                    active,
                    heroHook: description,
                    heroParagraphs: [],
                    heroCta: null,
                    sections: [
                        { key: 'descriptionLong', order: -1, text: descriptionLong, items: [] },
                        ...ESTANDAR_SECTION_KEYS.map((key, order) => ({ key, order, title: ESTANDAR_SECTION_LABELS[key].label, text: sections[key], items: [] })),
                    ],
                    faqs: faqs.map((f, order) => ({ ...f, order })),
                },
                initial?.id ?? null,
            );
            if (result.error) {
                setError(result.error);
                return;
            }
            router.push('/catalogo');
        });
    }

    return (
        <div className="max-w-4xl space-y-8 pb-12">
            
            {/* 1. Nombre y Descripciones */}
            <div className="glass-card p-6 space-y-6">
                <div>
                    <label className={LABEL_CLASS}>1. Nombre de la certificación</label>
                    <input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Ej. Instalador(a) Eléctrico(a) Clase D" className={FIELD_CLASS} autoFocus />
                </div>
                
                <div>
                    <label className={LABEL_CLASS}>2. Descripción corta</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Ej. ¡Valida tu experiencia! Obtén tu certificación oficial..." className={FIELD_CLASS} />
                </div>
                
                <div>
                    <label className={LABEL_CLASS}>3. Descripción larga</label>
                    <RichTextEditor
                        value={descriptionLong}
                        onChange={setDescriptionLong}
                        placeholder="Si tienes los conocimientos y habilidades..."
                    />
                </div>
            </div>

            {/* Secciones Dinámicas según PDF */}
            <div className="glass-card p-6 space-y-8">
                {ESTANDAR_SECTION_KEYS.map((key, index) => (
                    <div key={key}>
                        <label className={LABEL_CLASS}>{index + 4}. {ESTANDAR_SECTION_LABELS[key].label}</label>
                        <p className="text-sm text-slate-500 mb-2">{ESTANDAR_SECTION_LABELS[key].helper}</p>
                        <RichTextEditor
                            value={sections[key]}
                            onChange={(html) => updateSection(key, html)}
                        />
                    </div>
                ))}
            </div>

            {/* Preguntas Frecuentes */}
            <div className="glass-card p-6">
                <label className={LABEL_CLASS}>10. Preguntas frecuentes</label>
                <p className="text-sm text-slate-500 mb-4">Opcional. Resuelve las dudas más comunes.</p>
                
                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border border-slate-200 rounded-xl p-4 space-y-2 relative bg-white">
                            <button type="button" onClick={() => removeFaq(index)} className="absolute top-3 right-3 text-slate-300 hover:text-red-600">
                                <Trash2 size={16} />
                            </button>
                            <input
                                value={faq.question}
                                onChange={(e) => updateFaq(index, { question: e.target.value })}
                                placeholder="Pregunta"
                                className={clsx(FIELD_CLASS, 'font-bold pr-8')}
                            />
                            <textarea
                                value={faq.answer}
                                onChange={(e) => updateFaq(index, { answer: e.target.value })}
                                placeholder="Respuesta"
                                rows={2}
                                className={FIELD_CLASS}
                            />
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addFaq} className="mt-3 flex items-center gap-2 text-sm font-bold text-[#0B1E40] hover:underline">
                    <Plus size={16} /> Agregar pregunta
                </button>
            </div>

            {/* Imagen y Configuración Final */}
            <div className="glass-card p-6 space-y-6">
                <div>
                    <label className={LABEL_CLASS}>Imagen de la certificación</label>
                    <ImageUploadField value={image} onChange={setImage} />
                </div>
                
                <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={isChileValora} onChange={(e) => setIsChileValora(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#0B1E40] focus:ring-[#0B1E40]" /> 
                        Certificación ChileValora
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#0B1E40] focus:ring-[#0B1E40]" /> 
                        Destacada en inicio
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#0B1E40] focus:ring-[#0B1E40]" /> 
                        Activa (visible al publicar)
                    </label>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-4">{error}</div>}

            <div className="flex items-center justify-between sticky bottom-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-200">
                <button
                    type="button"
                    onClick={() => router.push('/catalogo')}
                    className="text-slate-500 hover:text-slate-800 font-bold px-4 py-2 transition-colors"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
                >
                    {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                    {isPending ? 'Guardando...' : 'Guardar y Publicar'}
                </button>
            </div>
        </div>
    );
}
