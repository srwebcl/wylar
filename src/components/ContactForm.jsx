import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Mail, AlertCircle } from 'lucide-react';
import { submitLead } from '../lib/crm.js';

// Motivo de contacto -> tipo de lead + certificación de interés para el CRM.
const MOTIVO_META = {
    empresas: { type: 'EMPRESA', certificationInterest: 'Cotización para empresas' },
    otec: { type: 'INSTITUCION', certificationInterest: 'Alianza para instituciones de educación' },
    electricista: { type: 'PERSONA', certificationInterest: 'Instalador Eléctrico Clase D' },
    cuidador: { type: 'PERSONA', certificationInterest: 'Cuidador(a) de Personas Mayores' },
    otro: { type: 'PERSONA', certificationInterest: null },
};

export default function ContactForm({ title = '', subtitle = '', preselectedContext = '', hideHeader = false }) {
    const [status, setStatus] = useState('idle'); // idle | sending | success | error
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);

        if (data.get('website')) return; // honeypot: no delatar el filtro

        const motivo = String(data.get('motivo') || '');
        const meta = MOTIVO_META[motivo] || MOTIVO_META.otro;

        setStatus('sending');
        setErrorMessage('');
        try {
            await submitLead({
                type: meta.type,
                name: data.get('name'),
                email: data.get('email'),
                phone: data.get('phone'),
                certificationInterest: meta.certificationInterest,
                message: data.get('message') || null,
            });
            setStatus('success');
            form.reset();
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

                <div className="flex flex-col lg:flex-row gap-16 items-start">

                    {/* Left Side: Value Proposition Features */}
                    <div className="w-full lg:w-1/2">

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1">Respaldo Oficial</h4>
                                    <p className="text-slate-600 leading-relaxed">Procesos de evaluación y certificación alineados con los estándares de ChileValora.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1">Financiamiento SENCE</h4>
                                    <p className="text-slate-600 leading-relaxed">Posibilidad de utilizar Franquicia Tributaria para procesos de evaluación de empresas.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-1">Cobertura en todo Chile</h4>
                                    <p className="text-slate-600 leading-relaxed">Capacidad operativa para ejecutar evaluaciones teóricas y prácticas en sus instalaciones.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="w-full lg:w-1/2">
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
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                                        <input name="phone" type="tel" className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" placeholder="+56 9 XXXXXXXX" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Correo corporativo / personal</label>
                                    <input name="email" type="email" className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" placeholder="correo@ejemplo.com" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Motivo de contacto</label>
                                    <select name="motivo" defaultValue={preselectedContext} className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all cursor-pointer" required>
                                        <option value="" disabled>Seleccione el servicio...</option>
                                        <option value="empresas">Cotización para Empresas (Múltiples trabajadores)</option>
                                        <option value="otec">Alianza para Instituciones de Educación</option>
                                        <option value="electricista">Evaluación Individual: Instalador Eléctrico Clase D</option>
                                        <option value="cuidador">Evaluación Individual: Cuidador/a de Personas</option>
                                        <option value="otro">Otras consultas</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mensaje (Opcional)</label>
                                    <textarea name="message" rows="3" className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none" placeholder="Indique cantidad de trabajadores, ubicación, etc."></textarea>
                                </div>

                                {status === 'error' && (
                                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg p-3">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" /> {errorMessage}
                                    </div>
                                )}

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
