'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, AlertTriangle, ExternalLink, UserCheck, Loader2 } from 'lucide-react';
import { createClientManual, type ClientFormState } from '@/actions/clients';
import { LEAD_TYPES } from '@/lib/constants';
import { isValidRut, formatRut } from '@/lib/rut';
import { isValidChileanMobile, formatChileanMobile } from '@/lib/phone';

const initialState: ClientFormState = {};

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-sm text-slate-900';
const errorInputClass = 'ring-2 ring-red-300 border-red-300';

const initialFields = {
    type: 'PERSONA',
    name: '',
    rut: '',
    email: '',
    phone: '',
    company: '',
};

export function CreateClientModal() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [fields, setFields] = useState(initialFields);
    const [fieldErrors, setFieldErrors] = useState<{ rut?: string; phone?: string }>({});
    const [forceSubmit, setForceSubmit] = useState(false);
    const [state, formAction, pending] = useActionState(createClientManual, initialState);

    function setField(key: keyof typeof initialFields) {
        return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setFields((f) => ({ ...f, [key]: e.target.value }));
        };
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
            setFieldErrors((errs) => ({ ...errs, phone: 'Debe ser un celular chileno (+56 9 XXXX XXXX).' }));
        }
    }

    useEffect(() => {
        if (state.success && state.clientId) {
            const newClientId = state.clientId;
            setOpen(false);
            setFields(initialFields);
            setForceSubmit(false);
            router.push(`/clientes/${newClientId}`);
        }
    }, [state.success, state.clientId, router]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const rutOk = isValidRut(fields.rut);
        const phoneCanonical = isValidChileanMobile(fields.phone) ? fields.phone : formatChileanMobile(fields.phone);

        const errors: { rut?: string; phone?: string } = {};
        if (!rutOk) errors.rut = 'RUT inválido. Revisa el número y el dígito verificador.';
        if (!phoneCanonical) errors.phone = 'Teléfono inválido. Debe ser un celular chileno (+56 9 XXXX XXXX).';

        setFieldErrors(errors);
        if (!rutOk || !phoneCanonical) return;

        const fd = new FormData();
        fd.set('type', fields.type);
        fd.set('name', fields.name.trim().toUpperCase());
        fd.set('rut', formatRut(fields.rut));
        fd.set('email', fields.email.trim().toLowerCase());
        fd.set('phone', phoneCanonical);
        if (fields.company.trim()) fd.set('company', fields.company.trim().toUpperCase());
        if (forceSubmit) fd.set('force', 'true');

        formAction(fd);
    }

    function handleCreateAnyway() {
        setForceSubmit(true);
        const phoneCanonical = isValidChileanMobile(fields.phone) ? fields.phone : formatChileanMobile(fields.phone);
        const fd = new FormData();
        fd.set('type', fields.type);
        fd.set('name', fields.name.trim().toUpperCase());
        fd.set('rut', formatRut(fields.rut));
        fd.set('email', fields.email.trim().toLowerCase());
        fd.set('phone', phoneCanonical || fields.phone);
        if (fields.company.trim()) fd.set('company', fields.company.trim().toUpperCase());
        fd.set('force', 'true');
        formAction(fd);
    }

    const isOrganization = fields.type !== 'PERSONA' && fields.type !== 'ALUMNO_BECADO';

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setOpen(true);
                    setForceSubmit(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
            >
                <Plus size={16} /> Nuevo Cliente
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera del Modal */}
                        <div className="bg-[#0B1E40] text-white px-6 py-4 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-base font-bold">Registrar Nuevo Cliente</h2>
                                <p className="text-xs text-slate-300">Crea la ficha única de una persona o empresa en el CRM</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            {/* Alerta de Duplicado */}
                            {state.duplicate && state.existingClient && (
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-3">
                                    <div className="flex items-start gap-2.5">
                                        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-bold text-amber-950">
                                                ¡Atención! Se encontró un cliente con datos coincidentes:
                                            </p>
                                            <p className="text-amber-800">
                                                <strong>{state.existingClient.name}</strong>
                                                {state.existingClient.rut ? ` · RUT: ${state.existingClient.rut}` : ''}
                                                <br />
                                                Correo: {state.existingClient.email} · Teléfono: {state.existingClient.phone}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-amber-200 flex-wrap">
                                        <Link
                                            href={`/clientes/${state.existingClient.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-colors"
                                            onClick={() => setOpen(false)}
                                        >
                                            <ExternalLink size={13} /> Ver ficha existente
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleCreateAnyway}
                                            disabled={pending}
                                            className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg font-semibold text-xs transition-colors"
                                        >
                                            Crear de todos modos
                                        </button>
                                    </div>
                                </div>
                            )}

                            {state.error && !state.duplicate && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                                    {state.error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Tipo de Cliente
                                    </label>
                                    <select
                                        value={fields.type}
                                        onChange={setField('type')}
                                        className={inputClass}
                                        required
                                    >
                                        {LEAD_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        RUT
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={fields.rut}
                                        onChange={setField('rut')}
                                        onBlur={handleRutBlur}
                                        placeholder="12.345.678-5"
                                        className={`${inputClass} ${fieldErrors.rut ? errorInputClass : ''}`}
                                    />
                                    {fieldErrors.rut && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.rut}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    {isOrganization ? 'Razón Social / Nombre Organización' : 'Nombre Completo'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={fields.name}
                                    onChange={setField('name')}
                                    placeholder={isOrganization ? 'EJ: TRANSPORTES NORTE GRANDE S.A.' : 'EJ: JUAN CARLOS PÉREZ'}
                                    className={inputClass}
                                />
                            </div>

                            {isOrganization && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Nombre de Fantasía (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={fields.company}
                                        onChange={setField('company')}
                                        placeholder="EJ: TRANSNORTE"
                                        className={inputClass}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={fields.email}
                                        onChange={setField('email')}
                                        placeholder="contacto@ejemplo.cl"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Teléfono Celular
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={fields.phone}
                                        onChange={setField('phone')}
                                        onBlur={handlePhoneBlur}
                                        placeholder="+56 9 1234 5678"
                                        className={`${inputClass} ${fieldErrors.phone ? errorInputClass : ''}`}
                                    />
                                    {fieldErrors.phone && (
                                        <p className="text-[11px] text-red-600 mt-1">{fieldErrors.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={pending}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                                >
                                    {pending ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Verificando...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck size={14} /> Registrar Cliente
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
