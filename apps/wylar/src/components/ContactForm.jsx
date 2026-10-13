import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Mail, AlertCircle } from 'lucide-react';
import { submitLead } from '../lib/crm.js';
import { getCatalogList } from '../lib/catalog.js';
import { isValidRut, formatRut } from '../lib/rut.js';
import { isValidChileanMobile, formatChileanMobile } from '../lib/phone.js';

// Motivo de contacto -> tipo de lead para el CRM. La certificación de
// interés ya no se infiere del motivo: la indica el propio prospecto (ver
// campo "Certificación de interés" más abajo).
const MOTIVO_TYPE = {
    personas: 'PERSONA',
    empresas: 'EMPRESA',
    otec: 'OTEC',
    instituciones: 'INSTITUCION',
};

export default function ContactForm({ title = '', subtitle = '', preselectedContext = '', hideHeader = false }) {
    const [status, setStatus] = useState('idle'); // idle | sending | success | error
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedMotivo, setSelectedMotivo] = useState(preselectedContext);
    const [rut, setRut] = useState('');
    const [phone, setPhone] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [certificationOptions, setCertificationOptions] = useState([]);

    useEffect(() => {
        getCatalogList()
            .then((profiles) => setCertificationOptions(profiles.map((p) => p.title).filter(Boolean)))
            .catch(() => {});
    }, []);

    function handleRutBlur() {
        if (!rut.trim()) return;
        if (isValidRut(rut)) {
            setRut(formatRut(rut));
            setFieldErrors((errs) => ({ ...errs, rut: undefined }));
        } else {
            setFieldErrors((errs) => ({ ...errs, rut: 'RUT inválido. Revisa el número y el dígito verificador.' }));
        }
    }

    function handlePhoneBlur() {
        if (!phone.trim()) return;
        const formatted = isValidChileanMobile(phone) ? phone : formatChileanMobile(phone);
        if (formatted) {
            setPhone(formatted);
            setFieldErrors((errs) => ({ ...errs, phone: undefined }));
        } else {
            setFieldErrors((errs) => ({ ...errs, phone: 'Teléfono inválido. Debe ser un celular chileno, ej: +56 9 1234 5678.' }));
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);

        if (data.get('website')) return; // honeypot: no delatar el filtro

        const rutOk = isValidRut(rut);
        const phoneCanonical = isValidChileanMobile(phone) ? phone : formatChileanMobile(phone);
        const errors = {};
        if (!rutOk) errors.rut = 'RUT inválido. Revisa el número y el dígito verificador.';
        if (!phoneCanonical) errors.phone = 'Teléfono inválido. Debe ser un celular chileno, ej: +56 9 1234 5678.';
        setFieldErrors(errors);
        if (errors.rut || errors.phone) return;

        const canonicalRut = formatRut(rut);
        setRut(canonicalRut);
        setPhone(phoneCanonical);

        const motivo = String(data.get('motivo') || '');
        const type = MOTIVO_TYPE[motivo] || 'PERSONA';

        setStatus('sending');
        setErrorMessage('');
        try {
            await submitLead({
                type,
                name: data.get('name'),
                rut: canonicalRut,
                email: data.get('email'),
                phone: phoneCanonical,
                company: data.get('company') || null,
                certificationInterest: data.get('certificationInterest') || null,
                message: data.get('message') || null,
            });
            setStatus('success');
            form.reset();
            setRut('');
            setPhone('');
            setFieldErrors({});
        } catch (err) {
            setStatus('error');
            setErrorMessage(err.message);
        }
    }

    if (status === 'success') {
        return (
            <section className={`bg-white ${hideHeader ? 'py-12' : 'py-24 border-t border-slate-100'}`} id="contacto">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
                        <CheckCircle2 className="text-emerald-600" size={30} />
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#0B1E40] mb-3">¡Solicitud enviada!</h3>
                    <p className="text-slate-600 mb-8">Recibimos tus datos correctamente. Nuestro equipo se contactará contigo en menos de 24 horas hábiles.</p>
                    <button onClick={() => setStatus('idle')} className="text-blue-700 font-bold hover:underline">
                        Enviar otra solicitud
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className={`bg-white ${hideHeader ? 'py-12' : 'py-24 border-t border-slate-100'} relative`} id="contacto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

                {/* Cabecera Unificada (Centrada) */}
                {!hideHeader && (
                    <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-8 h-px bg-blue-600/30"></span>
                            <span className="flex items-center gap-2 text-blue-700 text-sm font-bold tracking-[0.2em] uppercase">
                                <Mail size={16} /> Orientación Personalizada
                            </span>
                            <span className="w-8 h-px bg-blue-600/30"></span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1E40] mb-5 tracking-tight">
                            {title ? title : (
                                <>Solicita <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B1E40] to-blue-800">Información</span></>
                            )}
                        </h2>
                        <p className="text-base md:text-lg text-slate-600">
                            {subtitle || 'Cuéntanos qué necesitas y te ayudaremos a encontrar la mejor opción de certificación.'}
                        </p>
                    </div>
                )}

                <div className="flex justify-center items-start">
                    {/* Centered Form */}
                    <div className="w-full max-w-2xl">
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100">
                            <h3 className="text-2xl font-bold text-slate-900 mb-8">Solicitud de Contacto</h3>
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {/* Honeypot anti-spam: invisible para personas */}
                                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre completo</label>
                                        <input name="name" type="text" className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" placeholder="Su nombre" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">RUT</label>
                                        <input
                                            name="rut"
                                            type="text"
                                            value={rut}
                                            onChange={(e) => setRut(e.target.value)}
                                            onBlur={handleRutBlur}
                                            className={`w-full px-4 py-3 bg-slate-50 rounded-lg border outline-none transition-all ${fieldErrors.rut ? 'border-red-300 ring-2 ring-red-200' : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'}`}
                                            placeholder="12.345.678-9"
                                            required
                                        />
                                        {fieldErrors.rut && <p className="text-xs text-red-600 font-medium mt-1.5">{fieldErrors.rut}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                                        <input
                                            name="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            onBlur={handlePhoneBlur}
                                            className={`w-full px-4 py-3 bg-slate-50 rounded-lg border outline-none transition-all ${fieldErrors.phone ? 'border-red-300 ring-2 ring-red-200' : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'}`}
                                            placeholder="+56 9 XXXXXXXX"
                                            required
                                        />
                                        {fieldErrors.phone && <p className="text-xs text-red-600 font-medium mt-1.5">{fieldErrors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Correo corporativo / personal</label>
                                        <input name="email" type="email" className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" placeholder="correo@ejemplo.com" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Motivo de contacto</label>
                                    <select name="motivo" value={selectedMotivo} onChange={(e) => setSelectedMotivo(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all cursor-pointer" required>
                                        <option value="" disabled>Seleccione el servicio...</option>
                                        <option value="personas">Personas</option>
                                        <option value="empresas">Empresas</option>
                                        <option value="otec">OTEC</option>
                                        <option value="instituciones">Instituciones de Educación</option>
                                    </select>
                                </div>

                                {['empresas', 'otec', 'instituciones'].includes(selectedMotivo) && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de la Empresa / Institución</label>
                                        <input name="company" type="text" className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" placeholder="Nombre de su organización" required />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Certificación de interés</label>
                                    <input
                                        name="certificationInterest"
                                        type="text"
                                        list="certification-options"
                                        className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                                        placeholder="Ej: Rigger, Soldador Calificado, Instalador Eléctrico..."
                                    />
                                    <datalist id="certification-options">
                                        {certificationOptions.map((title) => (
                                            <option key={title} value={title} />
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mensaje</label>
                                    <textarea name="message" rows="3" className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none" placeholder="¿Buscas más de una certificación o algo distinto? Cuéntanos aquí, o indique cantidad de trabajadores, ubicación, etc."></textarea>
                                </div>

                                {status === 'error' && (
                                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg p-3">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" /> {errorMessage}
                                    </div>
                                )}

                                <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
                                    <input type="checkbox" name="consent" required className="mt-1 w-4 h-4 shrink-0 rounded border-slate-300 accent-[#0B1E40]" />
                                    <span>
                                        He leído y acepto la{' '}
                                        <a href="/politicas-privacidad" target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline">Política de Privacidad</a>{' '}
                                        y autorizo el uso de mis datos para responder esta solicitud.
                                    </span>
                                </label>

                                <button type="submit" disabled={status === 'sending'} className="w-full bg-[#0B1E40] hover:bg-blue-900 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2">
                                    {status === 'sending' ? (
                                        <>Enviando... <Loader2 size={20} className="animate-spin" /></>
                                    ) : (
                                        <>Enviar Solicitud <ArrowRight size={20} /></>
                                    )}
                                </button>
                                <p className="text-xs text-center text-slate-500 mt-4 font-medium">
                                    Sus datos están protegidos. Nos contactaremos en menos de 24 horas hábiles.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
