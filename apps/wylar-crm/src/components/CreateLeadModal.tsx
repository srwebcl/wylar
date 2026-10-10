'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import { createLeadManual, type LeadFormState } from '@/actions/leads';
import { LEAD_TYPES, PERSON_LEAD_TYPES } from '@/lib/constants';

const initialState: LeadFormState = {};
const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-sm text-slate-900';

export function CreateLeadModal({ certificationSuggestions }: { certificationSuggestions: string[] }) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState('PERSONA');
    const [state, formAction, pending] = useActionState(createLeadManual, initialState);

    useEffect(() => {
        if (state.success) {
            setOpen(false);
            setType('PERSONA');
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

    const isPerson = PERSON_LEAD_TYPES.includes(type);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
            >
                <Plus size={18} /> Nuevo prospecto
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setOpen(false)}>
                    <form
                        action={formAction}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-slate-900">Nuevo prospecto</h2>
                            <button type="button" onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
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
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tipo</span>
                                <select name="type" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                                    {LEAD_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nombre completo</span>
                                <input name="name" required className={inputClass} />
                            </label>
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Correo</span>
                                <input name="email" type="email" required className={inputClass} />
                            </label>
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Teléfono</span>
                                <input name="phone" required placeholder="+56 9 1234 5678" className={inputClass} />
                            </label>
                            {!isPerson && (
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Empresa / institución</span>
                                    <input name="company" className={inputClass} />
                                </label>
                            )}
                            <label className="block">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Certificación de interés</span>
                                <input name="certificationInterest" list="certification-suggestions" className={inputClass} />
                                <datalist id="certification-suggestions">
                                    {certificationSuggestions.map((c) => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
                            </label>
                        </div>

                        <label className="block">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Notas (opcional)</span>
                            <textarea name="message" rows={3} className={inputClass} placeholder="Contexto adicional, cómo llegó el contacto, etc." />
                        </label>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={pending}
                                className="flex items-center gap-2 bg-[#0B1E40] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#122b59] transition-colors disabled:opacity-60"
                            >
                                {pending ? 'Guardando…' : 'Crear prospecto'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
