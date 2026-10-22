'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, X, Sparkles } from 'lucide-react';
import { createLeadManual, getLeadSources, createLeadSource, type LeadFormState } from '@/actions/leads';
import { LEAD_TYPES, PERSON_LEAD_TYPES, DEFAULT_LEAD_SOURCES } from '@/lib/constants';
import { isValidRut, formatRut } from '@/lib/rut';
import { isValidChileanMobile, formatChileanMobile } from '@/lib/phone';
import { ComunaCombobox } from '@/components/ComunaCombobox';

const initialState: LeadFormState = {};
const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-sm text-slate-900';
const errorInputClass = 'ring-2 ring-red-300 border-red-300';

const initialFields = {
    type: 'PERSONA',
    name: '',
    rut: '',
    email: '',
    phone: '',
    company: '',
    productId: '',
    source: 'Web',
    comuna: '',
    message: '',
};

interface Category {
    id: number;
    name: string;
}
interface ProductOption {
    id: number;
    name: string;
    categoryId: number;
}
interface SourceOption {
    id: number;
    name: string;
}

export function CreateLeadModal({
    categories,
    products,
    sources: initialSources,
}: {
    categories: Category[];
    products: ProductOption[];
    sources?: SourceOption[];
}) {
    const [open, setOpen] = useState(false);
    const [fields, setFields] = useState(initialFields);
    const [fieldErrors, setFieldErrors] = useState<{ rut?: string; phone?: string }>({});
    const [state, formAction, pending] = useActionState(createLeadManual, initialState);

    // Lista de orígenes disponibles: comienza con los predeterminados + los de BD
    const [sourceList, setSourceList] = useState<string[]>(() => {
        const base = [...DEFAULT_LEAD_SOURCES];
        if (initialSources && initialSources.length > 0) {
            return Array.from(new Set([...base, ...initialSources.map((s) => s.name)]));
        }
        return base;
    });

    // Control para crear un nuevo origen en base de datos
    const [showNewSource, setShowNewSource] = useState(false);
    const [newSourceName, setNewSourceName] = useState('');
    const [savingSource, setSavingSource] = useState(false);
    const [sourceError, setSourceError] = useState<string | null>(null);

    function setField(key: keyof typeof initialFields) {
        return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setFields((f) => ({ ...f, [key]: e.target.value }));
    }

    // Refrescar orígenes desde la BD al abrir el modal
    useEffect(() => {
        if (!open) return;
        getLeadSources()
            .then((dbSources) => {
                if (dbSources && dbSources.length > 0) {
                    setSourceList((prev) => Array.from(new Set([...DEFAULT_LEAD_SOURCES, ...dbSources.map((s) => s.name), ...prev])));
                }
            })
            .catch(() => {});
    }, [open]);

    async function handleCreateSource() {
        const trimmed = newSourceName.trim();
        if (!trimmed) {
            setSourceError('Ingresa el nombre del origen.');
            return;
        }
        setSavingSource(true);
        setSourceError(null);
        try {
            const res = await createLeadSource(trimmed);
            if (!res.ok || !res.source) {
                setSourceError(res.error ?? 'No se pudo guardar el origen.');
                return;
            }
            const createdName = res.source.name;
            setSourceList((prev) => (prev.includes(createdName) ? prev : [...prev, createdName]));
            setFields((f) => ({ ...f, source: createdName }));
            setNewSourceName('');
            setShowNewSource(false);
        } catch {
            setSourceError('Error de conexión al guardar el origen.');
        } finally {
            setSavingSource(false);
        }
    }

    function handleRutBlur() {
        if (!fields.rut.trim()) return;
        if (isValidRut(fields.rut)) {
            setFields((f) => ({ ...f, rut: formatRut(f.rut) }));
            setFieldErrors((errs) => ({ ...errs, rut: undefined }));
        } else {
            setFieldErrors((errs) => ({ ...errs, rut: 'RUT inválido. Revisa el número y el dígito verificador.' }));
        }
    }

    function handlePhoneBlur() {
        if (!fields.phone.trim()) return;
        const formatted = isValidChileanMobile(fields.phone) ? fields.phone : formatChileanMobile(fields.phone);
        if (formatted) {
            setFields((f) => ({ ...f, phone: formatted }));
            setFieldErrors((errs) => ({ ...errs, phone: undefined }));
        } else {
            setFieldErrors((errs) => ({ ...errs, phone: 'Teléfono inválido. Debe ser un celular chileno, ej: +56 9 1234 5678.' }));
        }
    }

    function submitWith(form: HTMLFormElement, confirm: boolean) {
        const rutOk = isValidRut(fields.rut);
        const phoneCanonical = isValidChileanMobile(fields.phone) ? fields.phone : formatChileanMobile(fields.phone);
        const errors: { rut?: string; phone?: string } = {};
        if (!rutOk) errors.rut = 'RUT inválido. Revisa el número y el dígito verificador.';
        if (!phoneCanonical) errors.phone = 'Teléfono inválido. Debe ser un celular chileno, ej: +56 9 1234 5678.';
        setFieldErrors(errors);
        if (errors.rut || errors.phone) return;

        const canonicalRut = formatRut(fields.rut);
        setFields((f) => ({ ...f, rut: canonicalRut, phone: phoneCanonical! }));

        const fd = new FormData(form);
        fd.set('rut', canonicalRut);
        fd.set('phone', phoneCanonical!);
        fd.set('source', fields.source);
        if (confirm) fd.set('confirmSimilar', '1');
        formAction(fd);
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        submitWith(e.currentTarget, false);
    }

    function handleConfirmSimilar(e: React.MouseEvent<HTMLButtonElement>) {
        const form = e.currentTarget.closest('form');
        if (!form) return;
        submitWith(form, true);
    }

    useEffect(() => {
        if (state.success) {
            setOpen(false);
            setFields(initialFields);
            setFieldErrors({});
            setShowNewSource(false);
            setNewSourceName('');
            setSourceError(null);
        }
    }, [state.success]);

    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open]);

    const isPerson = PERSON_LEAD_TYPES.includes(fields.type);
    const productsByCategory = categories.map((c) => ({ category: c, options: products.filter((p) => p.categoryId === c.id) }));

    return (
        <>
            <button
                onClick={() => {
                    setFields(initialFields);
                    setShowNewSource(false);
                    setNewSourceName('');
                    setSourceError(null);
                    setOpen(true);
                }}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shrink-0 cursor-pointer"
            >
                <Plus size={18} /> Nueva oportunidad
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2.5 sm:p-4" onClick={() => setOpen(false)}>
                    <form
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 rounded-2xl shadow-xl"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div>
                                <h2 className="font-bold text-slate-900 text-base sm:text-lg">Nueva oportunidad</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Ingresa los datos del contacto y canal de origen para el seguimiento comercial.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {state.error && (
                            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
                                {state.error}
                                {state.duplicateLeadId && (
                                    <Link href={`/leads/${state.duplicateLeadId}`} className="block mt-1 font-bold underline">
                                        Ir a {state.duplicateLeadCode} →
                                    </Link>
                                )}
                                {state.similarOpportunityId && (
                                    <div className="mt-2 flex items-center gap-3">
                                        <Link href={`/leads/${state.similarOpportunityId}`} className="font-bold underline">
                                            Ver {state.similarOpportunityCode} →
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleConfirmSimilar}
                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold rounded-lg text-xs"
                                        >
                                            Crear de todas formas
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {/* Tipo de cliente */}
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tipo de cliente</span>
                                <select name="type" value={fields.type} onChange={setField('type')} className={inputClass}>
                                    {LEAD_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Origen de la oportunidad */}
                            <div className="block">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        Origen de la oportunidad
                                    </span>
                                    {!showNewSource && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowNewSource(true);
                                                setSourceError(null);
                                            }}
                                            className="text-xs text-amber-700 hover:text-amber-800 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <Plus size={13} /> + Nuevo origen
                                        </button>
                                    )}
                                </div>
                                <select
                                    name="source"
                                    required
                                    value={fields.source}
                                    onChange={setField('source')}
                                    className={inputClass}
                                >
                                    {sourceList.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>

                                {/* Formulario desplegable para registrar nueva alternativa de origen */}
                                {showNewSource && (
                                    <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2 animate-in fade-in duration-150">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                                <Sparkles size={13} className="text-amber-600" />
                                                Crear nueva alternativa
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowNewSource(false);
                                                    setNewSourceName('');
                                                    setSourceError(null);
                                                }}
                                                className="text-slate-400 hover:text-slate-600 p-0.5"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newSourceName}
                                                onChange={(e) => {
                                                    setNewSourceName(e.target.value);
                                                    setSourceError(null);
                                                }}
                                                placeholder="Ej. TikTok, Feria Minera..."
                                                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleCreateSource();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCreateSource}
                                                disabled={savingSource || !newSourceName.trim()}
                                                className="px-3 py-1.5 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                                            >
                                                {savingSource ? 'Guardando…' : 'Guardar en BD'}
                                            </button>
                                        </div>
                                        {sourceError && (
                                            <p className="text-[11px] text-red-600 font-medium">{sourceError}</p>
                                        )}
                                        <p className="text-[11px] text-slate-500">
                                            Se registrará en la base de datos y quedará guardada para todas las futuras oportunidades.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Nombre completo */}
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nombre completo</span>
                                <input name="name" required value={fields.name} onChange={setField('name')} className={inputClass} />
                            </label>

                            {/* RUT */}
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">RUT</span>
                                <input
                                    name="rut"
                                    required
                                    placeholder="12.345.678-9"
                                    value={fields.rut}
                                    onChange={setField('rut')}
                                    onBlur={handleRutBlur}
                                    className={`${inputClass} ${fieldErrors.rut ? errorInputClass : ''}`}
                                />
                                {fieldErrors.rut && <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.rut}</p>}
                            </label>

                            {/* Correo */}
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Correo</span>
                                <input name="email" type="email" required value={fields.email} onChange={setField('email')} className={inputClass} />
                            </label>

                            {/* Teléfono */}
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Teléfono</span>
                                <input
                                    name="phone"
                                    required
                                    placeholder="+56 9 1234 5678"
                                    value={fields.phone}
                                    onChange={setField('phone')}
                                    onBlur={handlePhoneBlur}
                                    className={`${inputClass} ${fieldErrors.phone ? errorInputClass : ''}`}
                                />
                                {fieldErrors.phone && <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.phone}</p>}
                            </label>

                            {/* Empresa / Institución (si no es persona) */}
                            {!isPerson && (
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Empresa / institución</span>
                                    <input name="company" value={fields.company} onChange={setField('company')} className={inputClass} />
                                </label>
                            )}

                            {/* Producto / Servicio */}
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Producto / servicio</span>
                                <select name="productId" required value={fields.productId} onChange={setField('productId')} className={inputClass}>
                                    <option value="" disabled>
                                        Selecciona un producto...
                                    </option>
                                    {productsByCategory.map(
                                        ({ category, options }) =>
                                            options.length > 0 && (
                                                <optgroup key={category.id} label={category.name}>
                                                    {options.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ),
                                    )}
                                </select>
                            </label>

                            {/* Comuna */}
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Comuna (opcional)</span>
                                <ComunaCombobox
                                    value={fields.comuna}
                                    onChange={(val) => setFields((f) => ({ ...f, comuna: val }))}
                                    name="comuna"
                                    placeholder="Busca tu comuna..."
                                />
                            </label>
                        </div>

                        {/* Notas */}
                        <label className="block">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Notas (opcional)</span>
                            <textarea
                                name="message"
                                rows={3}
                                value={fields.message}
                                onChange={setField('message')}
                                className={inputClass}
                                placeholder="Contexto adicional, observaciones del contacto, etc."
                            />
                        </label>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={pending}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0B1E40] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#122b59] transition-colors disabled:opacity-60 cursor-pointer"
                            >
                                {pending ? 'Guardando…' : 'Crear oportunidad'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
