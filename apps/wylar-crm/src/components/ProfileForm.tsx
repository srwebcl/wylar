'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { saveProfile } from '@/actions/catalog';
import type { ProfileInput } from '@/lib/validation';
import { PROFILE_TEMPLATE_TYPES, TARGET_AUDIENCES, sectionSpecsFor, type ProfileSectionSpec } from '@/lib/catalogSpec';

type SectionState = {
    key: string;
    title: string;
    text: string;
    intro: string;
    closing: string;
    note: string;
    items: { group: string; code: string; title: string; text: string }[];
};

type FaqState = { question: string; answer: string };

export interface ProfileFormInitial {
    id?: number;
    slug: string;
    templateType: string;
    title: string;
    description: string;
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
    heroHook: string;
    heroParagraphs: string[];
    heroCta: string;
    sections: SectionState[];
    faqs: FaqState[];
}

function emptyItem() {
    return { group: '', code: '', title: '', text: '' };
}

function sectionsFromSpec(templateType: string, existing: SectionState[]): SectionState[] {
    const specs = sectionSpecsFor(templateType);
    return specs.map((spec) => {
        const found = existing.find((s) => s.key === spec.key);
        return found ?? { key: spec.key, title: '', text: '', intro: '', closing: '', note: '', items: [] };
    });
}

export function ProfileForm({ initial }: { initial?: ProfileFormInitial }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [templateType, setTemplateType] = useState<string>(initial?.templateType ?? PROFILE_TEMPLATE_TYPES[0].value);
    const [slug, setSlug] = useState(initial?.slug ?? '');
    const [title, setTitle] = useState(initial?.title ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [image, setImage] = useState(initial?.image ?? '');
    const [category, setCategory] = useState(initial?.category ?? '');
    const [sector, setSector] = useState(initial?.sector ?? '');
    const [subsector, setSubsector] = useState(initial?.subsector ?? '');
    const [nivel, setNivel] = useState(initial?.nivel ?? '');
    const [vigencia, setVigencia] = useState(initial?.vigencia ?? '');
    const [target, setTarget] = useState<string[]>(initial?.target ?? ['personas']);
    const [isChileValora, setIsChileValora] = useState(initial?.isChileValora ?? false);
    const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
    const [active, setActive] = useState(initial?.active ?? true);
    const [heroHook, setHeroHook] = useState(initial?.heroHook ?? '');
    const [heroParagraphs, setHeroParagraphs] = useState<string[]>(initial?.heroParagraphs ?? []);
    const [heroCta, setHeroCta] = useState(initial?.heroCta ?? '');
    const [sections, setSections] = useState<SectionState[]>(() => sectionsFromSpec(initial?.templateType ?? templateType, initial?.sections ?? []));
    const [faqs, setFaqs] = useState<FaqState[]>(initial?.faqs ?? []);

    const specs = useMemo(() => sectionSpecsFor(templateType), [templateType]);

    function handleTemplateChange(next: string) {
        setTemplateType(next);
        setSections((prev) => sectionsFromSpec(next, prev));
    }

    function updateSection(key: string, patch: Partial<SectionState>) {
        setSections((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    }

    function addItem(key: string) {
        setSections((prev) => prev.map((s) => (s.key === key ? { ...s, items: [...s.items, emptyItem()] } : s)));
    }

    function updateItem(key: string, index: number, patch: Partial<{ group: string; code: string; title: string; text: string }>) {
        setSections((prev) =>
            prev.map((s) => (s.key === key ? { ...s, items: s.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) } : s)),
        );
    }

    function removeItem(key: string, index: number) {
        setSections((prev) => prev.map((s) => (s.key === key ? { ...s, items: s.items.filter((_, i) => i !== index) } : s)));
    }

    function toggleTarget(value: string) {
        setTarget((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const payload: ProfileInput = {
            slug,
            templateType,
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
            heroHook,
            heroParagraphs: heroParagraphs.filter((p) => p.trim()),
            heroCta: heroCta || null,
            sections: sections
                .filter((s) => s.title || s.text || s.intro || s.closing || s.note || s.items.length > 0)
                .map((s, order) => ({
                    key: s.key,
                    order,
                    title: s.title || null,
                    text: s.text || null,
                    intro: s.intro || null,
                    closing: s.closing || null,
                    note: s.note || null,
                    items: s.items
                        .filter((it) => it.group || it.code || it.title || it.text)
                        .map((it, itemOrder) => ({
                            order: itemOrder,
                            group: it.group || null,
                            code: it.code || null,
                            title: it.title || null,
                            text: it.text || null,
                        })),
                })),
            faqs: faqs
                .filter((f) => f.question && f.answer)
                .map((f, order) => ({ order, question: f.question, answer: f.answer })),
        };

        startTransition(async () => {
            const result = await saveProfile(payload, initial?.id ?? null);
            if (result.error) {
                setError(result.error);
                return;
            }
            router.push('/catalogo');
            router.refresh();
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <button type="button" onClick={() => router.push('/catalogo')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <ArrowLeft size={16} /> Volver al catálogo
            </button>

            {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <section className="glass-card p-6 space-y-4">
                <h2 className="font-bold text-slate-900">Datos generales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Slug (URL en wylar.cl)">
                        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="instalador-electrico" className={inputClass} required />
                    </Field>
                    <Field label="Plantilla">
                        <select value={templateType} onChange={(e) => handleTemplateChange(e.target.value)} className={inputClass}>
                            {PROFILE_TEMPLATE_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Título" className="md:col-span-2">
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Descripción (tarjeta del catálogo)" className="md:col-span-2">
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={2} required />
                    </Field>
                    <Field label="Imagen (ruta o URL)">
                        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="/images/hero_electricista.jpg" className={inputClass} required />
                    </Field>
                    <Field label="Categoría">
                        <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Sector">
                        <input value={sector} onChange={(e) => setSector(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Subsector">
                        <input value={subsector} onChange={(e) => setSubsector(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Nivel">
                        <input value={nivel} onChange={(e) => setNivel(e.target.value)} placeholder="Nivel 3" className={inputClass} required />
                    </Field>
                    <Field label="Vigencia (si aplica)">
                        <input value={vigencia} onChange={(e) => setVigencia(e.target.value)} placeholder="2 años" className={inputClass} />
                    </Field>
                </div>

                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Público objetivo</p>
                    <div className="flex gap-4 flex-wrap">
                        {TARGET_AUDIENCES.map((t) => (
                            <label key={t.value} className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked={target.includes(t.value)} onChange={() => toggleTarget(t.value)} />
                                {t.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex gap-6 flex-wrap">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={isChileValora} onChange={(e) => setIsChileValora(e.target.checked)} /> Es certificación ChileValora
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Destacado en el catálogo
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Activo (visible en wylar.cl)
                    </label>
                </div>
            </section>

            <section className="glass-card p-6 space-y-4">
                <h2 className="font-bold text-slate-900">Hero de la ficha</h2>
                <Field label="Gancho (pregunta inicial)">
                    <textarea value={heroHook} onChange={(e) => setHeroHook(e.target.value)} className={inputClass} rows={2} required />
                </Field>
                <ListEditor
                    label="Párrafos del hero"
                    items={heroParagraphs}
                    onChange={setHeroParagraphs}
                    placeholder="Párrafo introductorio..."
                />
                <Field label="Texto del botón de llamada a la acción">
                    <input value={heroCta} onChange={(e) => setHeroCta(e.target.value)} placeholder="Quiero certificar mis competencias" className={inputClass} />
                </Field>
            </section>

            {specs.map((spec) => {
                const section = sections.find((s) => s.key === spec.key);
                if (!section) return null;
                return (
                    <SectionEditor
                        key={spec.key}
                        spec={spec}
                        section={section}
                        onChange={(patch) => updateSection(spec.key, patch)}
                        onAddItem={() => addItem(spec.key)}
                        onUpdateItem={(i, patch) => updateItem(spec.key, i, patch)}
                        onRemoveItem={(i) => removeItem(spec.key, i)}
                    />
                );
            })}

            <section className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">Preguntas frecuentes</h2>
                    <button type="button" onClick={() => setFaqs((prev) => [...prev, { question: '', answer: '' }])} className={addButtonClass}>
                        <Plus size={14} /> Agregar pregunta
                    </button>
                </div>
                {faqs.map((faq, i) => (
                    <div key={i} className="border border-slate-100 rounded-xl p-4 space-y-2 relative">
                        <button type="button" onClick={() => setFaqs((prev) => prev.filter((_, idx) => idx !== i))} className={removeButtonClass}>
                            <Trash2 size={14} />
                        </button>
                        <Field label="Pregunta">
                            <input
                                value={faq.question}
                                onChange={(e) => setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, question: e.target.value } : f)))}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Respuesta">
                            <textarea
                                value={faq.answer}
                                onChange={(e) => setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, answer: e.target.value } : f)))}
                                className={inputClass}
                                rows={2}
                            />
                        </Field>
                    </div>
                ))}
                {faqs.length === 0 && <p className="text-sm text-slate-400">Sin preguntas frecuentes todavía.</p>}
            </section>

            <div className="flex justify-end gap-3">
                <button type="button" onClick={() => router.push('/catalogo')} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                >
                    <Save size={16} /> {isPending ? 'Guardando…' : 'Guardar perfil'}
                </button>
            </div>
        </form>
    );
}

function SectionEditor({
    spec,
    section,
    onChange,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
}: {
    spec: ProfileSectionSpec;
    section: SectionState;
    onChange: (patch: Partial<SectionState>) => void;
    onAddItem: () => void;
    onUpdateItem: (index: number, patch: Partial<{ group: string; code: string; title: string; text: string }>) => void;
    onRemoveItem: (index: number) => void;
}) {
    return (
        <section className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-slate-900">{spec.label}</h2>

            {spec.hasTitle && (
                <Field label="Título">
                    <input value={section.title} onChange={(e) => onChange({ title: e.target.value })} className={inputClass} />
                </Field>
            )}
            {spec.hasIntro && (
                <Field label="Introducción">
                    <textarea value={section.intro} onChange={(e) => onChange({ intro: e.target.value })} className={inputClass} rows={2} />
                </Field>
            )}
            {spec.hasText && (
                <Field label="Texto">
                    <textarea value={section.text} onChange={(e) => onChange({ text: e.target.value })} className={inputClass} rows={3} />
                </Field>
            )}
            {spec.hasClosing && (
                <Field label="Cierre">
                    <textarea value={section.closing} onChange={(e) => onChange({ closing: e.target.value })} className={inputClass} rows={2} />
                </Field>
            )}
            {spec.hasNote && (
                <Field label="Nota">
                    <textarea value={section.note} onChange={(e) => onChange({ note: e.target.value })} className={inputClass} rows={2} />
                </Field>
            )}

            {spec.itemShape !== 'none' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{spec.itemLabel ?? 'Ítems'}</p>
                        <button type="button" onClick={onAddItem} className={addButtonClass}>
                            <Plus size={14} /> Agregar
                        </button>
                    </div>
                    {section.items.map((item, i) => (
                        <div key={i} className="flex gap-2 items-start border border-slate-100 rounded-xl p-3">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {spec.itemShape === 'grouped' && (
                                    <input
                                        value={item.group}
                                        onChange={(e) => onUpdateItem(i, { group: e.target.value })}
                                        placeholder="Grupo (ej. placa, tubería)"
                                        className={inputClass}
                                    />
                                )}
                                {spec.itemShape === 'coded' && (
                                    <input value={item.code} onChange={(e) => onUpdateItem(i, { code: e.target.value })} placeholder="Código (ej. SMAW)" className={inputClass} />
                                )}
                                {spec.itemShape === 'titled' && (
                                    <input value={item.title} onChange={(e) => onUpdateItem(i, { title: e.target.value })} placeholder="Título" className={inputClass} />
                                )}
                                <input
                                    value={item.text}
                                    onChange={(e) => onUpdateItem(i, { text: e.target.value })}
                                    placeholder={spec.itemShape === 'text' ? 'Texto' : 'Descripción'}
                                    className={`${inputClass} ${spec.itemShape === 'text' ? 'md:col-span-2' : ''}`}
                                />
                            </div>
                            <button type="button" onClick={() => onRemoveItem(i)} className={removeButtonClass}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {section.items.length === 0 && <p className="text-sm text-slate-400">Sin ítems todavía.</p>}
                </div>
            )}
        </section>
    );
}

function ListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder?: string }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
                <button type="button" onClick={() => onChange([...items, ''])} className={addButtonClass}>
                    <Plus size={14} /> Agregar
                </button>
            </div>
            {items.map((value, i) => (
                <div key={i} className="flex gap-2">
                    <textarea
                        value={value}
                        onChange={(e) => onChange(items.map((v, idx) => (idx === i ? e.target.value : v)))}
                        placeholder={placeholder}
                        className={inputClass}
                        rows={2}
                    />
                    <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className={removeButtonClass}>
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <label className={`block ${className ?? ''}`}>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';
const addButtonClass = 'flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-900 transition-colors';
const removeButtonClass = 'p-2 text-slate-400 hover:text-red-600 transition-colors shrink-0';
