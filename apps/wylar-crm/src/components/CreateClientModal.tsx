'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    X,
    AlertTriangle,
    ExternalLink,
    UserCheck,
    Loader2,
    User,
    Building2,
    GraduationCap,
    Wrench,
    Award,
    Mail,
    Phone,
    IdCard,
    Check,
} from 'lucide-react';
import { createClientManual, type ClientFormState } from '@/actions/clients';
import { isValidRut, formatRut } from '@/lib/rut';
import { isValidChileanMobile, formatChileanMobile } from '@/lib/phone';

const initialState: ClientFormState = {};

const TYPE_OPTIONS = [
    { value: 'PERSONA', label: 'Persona Natural', desc: 'Profesional, trabajador o particular', icon: User },
    { value: 'EMPRESA', label: 'Empresa', desc: 'Razón social o cliente corporativo', icon: Building2 },
    { value: 'INSTITUCION', label: 'Institución', desc: 'Universidad, CFT o entidad educativa', icon: GraduationCap },
    { value: 'OTEC', label: 'OTEC', desc: 'Organismo técnico de capacitación', icon: Wrench },
    { value: 'ALUMNO_BECADO', label: 'Alumno Becado', desc: 'Estudiante con beneficio o beca', icon: Award },
] as const;

export function CreateClientModal() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [fields, setFields] = useState({
        type: 'PERSONA',
        name: '',
        rut: '',
        email: '',
        phone: '',
        company: '',
    });
    const [fieldErrors, setFieldErrors] = useState<{ rut?: string; phone?: string }>({});
    const [forceSubmit, setForceSubmit] = useState(false);
    const [state, formAction, pending] = useActionState(createClientManual, initialState);

    function setField(key: string, value: string) {
        setFields((f) => ({ ...f, [key]: value }));
    }

    function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value.toUpperCase();
        setField('rut', val);
        if (fieldErrors.rut) setFieldErrors((errs) => ({ ...errs, rut: undefined }));
    }

    function handleRutBlur() {
        if (!fields.rut.trim()) return;
        if (isValidRut(fields.rut)) {
            setField('rut', formatRut(fields.rut));
            setFieldErrors((errs) => ({ ...errs, rut: undefined }));
        } else {
            setFieldErrors((errs) => ({ ...errs, rut: 'RUT inválido. Revisa el número y el dígito verificador.' }));
        }
    }

    function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setField('phone', val);
        if (fieldErrors.phone) setFieldErrors((errs) => ({ ...errs, phone: undefined }));
    }

    function handlePhoneBlur() {
        if (!fields.phone.trim()) return;
        const formatted = isValidChileanMobile(fields.phone) ? fields.phone : formatChileanMobile(fields.phone);
        if (formatted) {
            setField('phone', formatted);
            setFieldErrors((errs) => ({ ...errs, phone: undefined }));
        } else {
            setFieldErrors((errs) => ({ ...errs, phone: 'Debe ser un celular chileno (+56 9 XXXX XXXX).' }));
        }
    }

    useEffect(() => {
        if (state.success && state.clientId) {
            const newClientId = state.clientId;
            setOpen(false);
            setFields({
                type: 'PERSONA',
                name: '',
                rut: '',
                email: '',
                phone: '',
                company: '',
            });
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
    const isRutValid = fields.rut.trim() && isValidRut(fields.rut);

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setOpen(true);
                    setForceSubmit(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
            >
                <Plus size={16} /> Nuevo Cliente
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabecera Premium */}
                        <div className="bg-gradient-to-r from-[#0B1E40] to-[#122b59] text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/10">
                                    <UserCheck size={20} className="text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold tracking-tight">Registrar Nuevo Cliente</h2>
                                    <p className="text-xs text-slate-300">
                                        Ficha maestra de cliente con verificación automática de duplicados
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Formulario Estructurado */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                            {/* Alerta de Duplicado con Comparación Clara */}
                            {state.duplicate && state.existingClient && (
                                <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300/80 text-xs text-amber-950 space-y-3 animate-in fade-in">
                                    <div className="flex items-start gap-2.5">
                                        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm text-amber-950">
                                                ¡Atención! Ya existe un cliente registrado con datos coincidentes
                                            </p>
                                            <p className="text-amber-900 leading-relaxed">
                                                El sistema detectó coincidencia en el{' '}
                                                <strong className="underline">
                                                    {state.duplicateReason === 'rut'
                                                        ? 'RUT'
                                                        : state.duplicateReason === 'email'
                                                        ? 'correo electrónico'
                                                        : 'teléfono'}
                                                </strong>
                                                . Puedes revisar la ficha ya existente para no duplicar historiales:
                                            </p>
                                        </div>
                                    </div>

                                    {/* Ficha Resumen del Cliente Existente */}
                                    <div className="bg-white/95 rounded-lg p-3 border border-amber-200/90 text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900 text-sm">
                                                {state.existingClient.name}
                                            </span>
                                            {state.existingClient.rut && (
                                                <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                                                    {state.existingClient.rut}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-600 text-[11px] pt-1">
                                            <span>✉️ {state.existingClient.email}</span>
                                            <span>📞 {state.existingClient.phone}</span>
                                            {state.existingClient.company && (
                                                <span>🏢 {state.existingClient.company}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                                        <Link
                                            href={`/clientes/${state.existingClient.id}`}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm"
                                            onClick={() => setOpen(false)}
                                        >
                                            <ExternalLink size={13} /> Ver ficha existente
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleCreateAnyway}
                                            disabled={pending}
                                            className="px-3.5 py-2 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                                        >
                                            Crear como cliente separado (forzar)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {state.error && !state.duplicate && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                                    {state.error}
                                </div>
                            )}

                            {/* Sección 1: Selector visual de Tipo de Cliente */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    1. Tipo de Cliente
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {TYPE_OPTIONS.map((opt) => {
                                        const isSelected = fields.type === opt.value;
                                        const Icon = opt.icon;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setField('type', opt.value)}
                                                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[#0B1E40]/5 border-[#0B1E40] ring-2 ring-[#0B1E40]/20'
                                                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={`p-1 rounded-lg ${
                                                            isSelected ? 'bg-[#0B1E40] text-white' : 'text-slate-500'
                                                        }`}
                                                    >
                                                        <Icon size={14} />
                                                    </span>
                                                    {isSelected && <Check size={14} className="text-[#0B1E40]" />}
                                                </div>
                                                <div>
                                                    <p
                                                        className={`text-xs font-bold ${
                                                            isSelected ? 'text-[#0B1E40]' : 'text-slate-800'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 line-clamp-1">{opt.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sección 2: Identificación Oficial */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    2. Identificación Oficial
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            {isOrganization
                                                ? 'Razón Social Oficial (según SII)'
                                                : 'Nombre y Apellidos Completos'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                value={fields.name}
                                                onChange={(e) => setField('name', e.target.value)}
                                                placeholder={
                                                    isOrganization
                                                        ? 'EJ: MINERA Y TRANSPORTES DEL NORTE S.A.'
                                                        : 'EJ: JUAN CARLOS PÉREZ GÓMEZ'
                                                }
                                                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-slate-900 uppercase font-medium"
                                            />
                                            <div className="absolute left-3 top-3 text-slate-400">
                                                {isOrganization ? <Building2 size={16} /> : <User size={16} />}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            RUT Oficial
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                value={fields.rut}
                                                onChange={handleRutChange}
                                                onBlur={handleRutBlur}
                                                placeholder="12.345.678-5"
                                                className={`w-full pl-9 pr-9 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all font-mono font-medium text-slate-900 ${
                                                    fieldErrors.rut
                                                        ? 'border-red-300 ring-2 ring-red-200'
                                                        : 'border-slate-200'
                                                }`}
                                            />
                                            <div className="absolute left-3 top-3 text-slate-400">
                                                <IdCard size={16} />
                                            </div>
                                            {isRutValid && (
                                                <div className="absolute right-3 top-3 text-emerald-600" title="RUT Válido">
                                                    <Check size={16} />
                                                </div>
                                            )}
                                        </div>
                                        {fieldErrors.rut && (
                                            <p className="text-[11px] text-red-600 mt-1">{fieldErrors.rut}</p>
                                        )}
                                    </div>

                                    {isOrganization ? (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                                Nombre de Fantasía o Marca (opcional)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={fields.company}
                                                    onChange={(e) => setField('company', e.target.value)}
                                                    placeholder="EJ: TRANSNORTE"
                                                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-slate-900 uppercase font-medium"
                                                />
                                                <div className="absolute left-3 top-3 text-slate-400">
                                                    <Building2 size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                                Empresa donde trabaja (opcional)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={fields.company}
                                                    onChange={(e) => setField('company', e.target.value)}
                                                    placeholder="EJ: CODELCO, BHP, etc."
                                                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-slate-900 uppercase"
                                                />
                                                <div className="absolute left-3 top-3 text-slate-400">
                                                    <Building2 size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sección 3: Datos de Contacto */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    3. Canales de Contacto Directo
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Correo Electrónico
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                required
                                                value={fields.email}
                                                onChange={(e) => setField('email', e.target.value.toLowerCase())}
                                                placeholder="contacto@ejemplo.cl"
                                                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-slate-900 lowercase font-medium"
                                            />
                                            <div className="absolute left-3 top-3 text-slate-400">
                                                <Mail size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Teléfono Celular
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                required
                                                value={fields.phone}
                                                onChange={handlePhoneChange}
                                                onBlur={handlePhoneBlur}
                                                placeholder="+56 9 1234 5678"
                                                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all font-medium text-slate-900 ${
                                                    fieldErrors.phone
                                                        ? 'border-red-300 ring-2 ring-red-200'
                                                        : 'border-slate-200'
                                                }`}
                                            />
                                            <div className="absolute left-3 top-3 text-slate-400">
                                                <Phone size={16} />
                                            </div>
                                        </div>
                                        {fieldErrors.phone && (
                                            <p className="text-[11px] text-red-600 mt-1">{fieldErrors.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={pending}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                                >
                                    {pending ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Verificando datos...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck size={14} /> Registrar Cliente Oficial
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
