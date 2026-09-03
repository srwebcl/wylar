import React, { useState } from 'react';
import { Users, Building2, ArrowRight, ShieldCheck, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const AUDIENCIAS = [
    {
        key: 'persona',
        pillLabel: 'Soy persona',
        icon: Users,
        href: '/personas',
        gradient: 'bg-gradient-to-br from-[#0B1E40] via-[#0B1E40] to-[#0b4a57]',
        glow: 'shadow-[0_30px_70px_-20px_rgba(34,211,238,0.45)]',
        headline: 'Certifica lo que ya sabes hacer',
        bullets: [
            'Sin importar cómo aprendiste el oficio',
            'Evaluación práctica, no solo un examen',
            'Certificado con validez nacional ChileValora',
        ],
        ctaLabel: 'Portal Personas',
    },
    {
        key: 'institucion',
        pillLabel: 'Somos institución educativa',
        icon: ShieldCheck,
        href: '/instituciones',
        gradient: 'bg-gradient-to-br from-[#0B1E40] via-[#0B1E40] to-[#6b4610]',
        glow: 'shadow-[0_30px_70px_-20px_rgba(245,158,11,0.45)]',
        headline: 'Certifica a tus egresados',
        bullets: [
            'Evaluación al cierre de la malla formativa',
            'Alianza directa con OTEC, CFT y universidades',
            'Doble valor: aprendizaje + certificación oficial',
        ],
        ctaLabel: 'Portal Instituciones',
    },
    {
        key: 'empresa',
        pillLabel: 'Somos empresa',
        icon: Building2,
        href: '/empresas',
        gradient: 'bg-gradient-to-br from-[#0B1E40] via-[#0B1E40] to-[#1e3a8a]',
        glow: 'shadow-[0_30px_70px_-20px_rgba(59,130,246,0.45)]',
        headline: 'Certifica a tu equipo en terreno',
        bullets: [
            'Evaluamos en tus faenas y turnos',
            'Financiable con Franquicia Tributaria SENCE',
            'Cumple normativa y reduce riesgo operativo',
        ],
        ctaLabel: 'Portal Empresas',
    },
];

export default function Portales() {
    const [activeKey, setActiveKey] = useState('persona');
    const activeIndex = AUDIENCIAS.findIndex((a) => a.key === activeKey);
    const active = AUDIENCIAS[activeIndex];
    const ActiveIcon = active.icon;

    const goTo = (i) => setActiveKey(AUDIENCIAS[((i % AUDIENCIAS.length) + AUDIENCIAS.length) % AUDIENCIAS.length].key);

    return (
        <section id="portales" className="py-24 bg-white border-b border-slate-100 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-8 h-px bg-blue-600/30"></span>
                        <span className="flex items-center gap-2 text-blue-700 text-sm font-bold tracking-[0.2em] uppercase">
                            <Users size={16} /> Encuentra la opción que necesitas
                        </span>
                        <span className="w-8 h-px bg-blue-600/30"></span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1E40] mb-5 tracking-tight">
                        Elige cómo quieres <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B1E40] to-blue-800">Certificarte</span>
                    </h2>
                    <p className="text-base md:text-lg text-slate-600">En Wylar contamos con soluciones especializadas para Personas, Instituciones de Educación o Empresas. Selecciona el perfil que más se adecúa a tu búsqueda y descubre el proceso.</p>
                </div>

                <div className="max-w-3xl mx-auto">
                    {/* Selector: una pregunta, no tres cajas */}
                    <div className="flex flex-wrap justify-center gap-3 mb-8" role="tablist" aria-label="Selecciona tu perfil">
                        {AUDIENCIAS.map((a) => {
                            const Icon = a.icon;
                            const isActive = a.key === activeKey;
                            return (
                                <button
                                    key={a.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActiveKey(a.key)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-bold text-sm transition-colors ${
                                        isActive
                                            ? 'bg-[#0B1E40] border-[#0B1E40] text-white'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                    <Icon size={16} /> {a.pillLabel}
                                </button>
                            );
                        })}
                    </div>

                    {/* Panel: contenido y CTA se adaptan a la respuesta */}
                    <style>{`@keyframes portalPanelIn { from { opacity:0; transform:translateY(10px) scale(0.985); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
                    <div
                        key={active.key}
                        style={{ animation: 'portalPanelIn 480ms cubic-bezier(0.22,1,0.36,1)' }}
                        className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 pl-16 sm:pl-20 pr-16 sm:pr-20 flex flex-col sm:flex-row gap-8 ${active.gradient} ${active.glow}`}
                    >
                        {/* Ícono gigante de fondo, decorativo */}
                        <ActiveIcon
                            size={260}
                            strokeWidth={1}
                            className="pointer-events-none absolute -right-10 -bottom-14 text-white/[0.07] rotate-6"
                        />

                        <div className="relative flex-none w-16 h-16 rounded-2xl flex items-center justify-center bg-white/15 ring-1 ring-white/25 shadow-[0_0_30px_rgba(255,255,255,0.15)] backdrop-blur-sm">
                            <ActiveIcon size={30} className="text-white" />
                        </div>
                        <div className="relative flex-1 min-w-0">
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-5 tracking-tight leading-tight">
                                {active.headline}
                            </h3>
                            <ul className="space-y-3 mb-8">
                                {active.bullets.map((b) => (
                                    <li key={b} className="flex items-start gap-3 text-sm sm:text-base text-white/85">
                                        <span className="mt-0.5 flex-none w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                                            <Check size={12} strokeWidth={3} className="text-white" />
                                        </span>
                                        {b}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={active.href}
                                className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm bg-white text-[#0B1E40] hover:bg-slate-50 shadow-xl transition-all hover:-translate-y-0.5 group/link"
                            >
                                {active.ctaLabel} <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                            </a>
                        </div>

                        {/* Flechas: navegar el carrusel de perfiles sin depender de las pestañas */}
                        <button
                            type="button"
                            aria-label="Perfil anterior"
                            onClick={() => goTo(activeIndex - 1)}
                            className="absolute z-10 left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            type="button"
                            aria-label="Siguiente perfil"
                            onClick={() => goTo(activeIndex + 1)}
                            className="absolute z-10 right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
