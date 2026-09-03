import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { perfiles } from '../data/perfiles.js';

// Slide 1: el hero principal (se mantiene igual a la versión estática anterior)
const MAIN_SLIDE = {
    id: 'main',
    image: '/images/hero_principal.jpg',
    categoryLabel: 'Presentación',
    eyebrowLead: 'Centro Acreditado',
    eyebrowAccent: 'ChileValora',
    title: 'Certificamos tus',
    titleHighlight: 'competencias laborales.',
    description: (
        <>
            <strong className="font-semibold text-cyan-300">Evaluamos y certificamos lo que sabes hacer</strong> con
            procesos confiables y respaldo oficial. Para personas, empresas e instituciones de educación en todo
            Chile.
        </>
    ),
    ctaLabel: 'Quiero Certificarme',
    ctaHref: '/#portales',
    ctaIcon: Users,
};

// Slides 2-5: los perfiles destacados del catálogo (antes solo "de apoyo" en el fondo del hero)
const PROFILE_SLIDES = perfiles
    .filter((p) => p.isFeatured)
    .map((p) => ({
        id: p.id,
        image: p.image,
        categoryLabel: p.category,
        eyebrowLead: p.isChileValora ? 'Centro Acreditado' : 'Certificación',
        eyebrowAccent: p.isChileValora ? 'ChileValora' : 'Privada Wylar',
        title: 'Certifícate como',
        titleHighlight: p.title,
        description: p.description,
        ctaLabel: 'Ver perfil completo',
        ctaHref: p.link,
        ctaIcon: ArrowRight,
    }));

const slides = [MAIN_SLIDE, ...PROFILE_SLIDES];
const AUTOPLAY_MS = 5500;

export default function HeroSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const goTo = (i) => setCurrentIndex(((i % slides.length) + slides.length) % slides.length);

    useEffect(() => {
        if (isPaused) return;
        const timeout = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, AUTOPLAY_MS);
        return () => clearTimeout(timeout);
    }, [currentIndex, isPaused]);

    const slide = slides[currentIndex];
    const CtaIcon = slide.ctaIcon;

    return (
        <div className="contents" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            <style>{`@keyframes heroProgressFill { from { width: 0% } to { width: 100% } }`}</style>

            {/* BACKGROUND LAYER (Ken Burns) */}
            <div className="absolute inset-0 overflow-hidden bg-[#050B14] pointer-events-none z-0">
                {slides.map((s, index) => {
                    const isActive = index === currentIndex;
                    return (
                        <div
                            key={s.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                        >
                            <div
                                className={`w-full h-full bg-cover bg-center md:bg-[80%_center] transition-transform ease-out duration-[10000ms] ${
                                    isActive ? 'scale-[1.05]' : 'scale-100'
                                }`}
                                style={{ backgroundImage: `url('${s.image}')` }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Scrim oscuro: legible a la izquierda, foto a la vista a la derecha */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050B14] via-[#050B14]/80 sm:via-[#050B14]/65 to-[#050B14]/10 md:to-transparent z-[15]"></div>
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#050B14] via-[#050B14]/60 to-transparent z-[15]"></div>

            {/* CONTENT LAYER */}
            <div className="max-w-7xl mx-auto pl-4 pr-4 sm:pl-6 sm:pr-6 md:pl-24 md:pr-8 lg:pl-28 lg:pr-8 relative z-20 w-full pt-10 pb-24 sm:pt-16 sm:pb-28 md:py-32">
                <div className="max-w-2xl mx-auto md:mx-0 text-center md:text-left">
                    <div className="flex justify-center md:justify-start mb-4 sm:mb-6 md:mb-8">
                        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#0B1E40] to-[#122b59] shadow-lg text-white text-sm font-bold tracking-wide border border-white/10">
                            <ShieldCheck size={18} className="text-blue-400" />
                            <span>
                                {slide.eyebrowLead} <span className="font-medium text-blue-200">{slide.eyebrowAccent}</span>
                            </span>
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] mb-4 sm:mb-6 text-white">
                        {slide.title}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300 inline-block leading-[1.35] pb-1 md:whitespace-nowrap mt-1 md:mt-0">
                            {slide.titleHighlight}
                        </span>
                    </h1>

                    <p className="text-base md:text-lg text-white/80 mb-6 sm:mb-8 md:mb-12 leading-relaxed max-w-xl mx-auto md:mx-0">
                        {slide.description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <a
                            href={slide.ctaHref}
                            className="relative overflow-hidden group bg-gradient-to-r from-[#0B1E40] to-blue-900 hover:from-blue-900 hover:to-blue-700 text-white px-6 py-3 rounded-full flex items-center justify-center gap-2.5 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 font-bold text-base"
                        >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                            <CtaIcon size={18} className="relative z-10" />
                            <span className="relative z-10">{slide.ctaLabel}</span>
                        </a>
                        <a
                            href="/catalogo"
                            className="bg-white hover:bg-slate-50 border-2 border-white/10 hover:border-white/20 text-[#0B1E40] px-6 py-3 rounded-full font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <BookOpen size={18} />
                            Conoce los Perfiles
                        </a>
                    </div>

                    {/* Miniaturas: reemplazan a los dots, muestran la foto real de cada slide */}
                    <div
                        className="flex items-center gap-2 mt-6 sm:mt-8 md:mt-12 overflow-x-auto px-3 -mx-3 py-3 -my-3 justify-center md:justify-start [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        role="tablist"
                        aria-label="Slides del hero"
                    >
                        {slides.map((s, index) => {
                            const isActive = index === currentIndex;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    role="tab"
                                    aria-label={`Ir al slide ${index + 1} de ${slides.length}: ${s.categoryLabel}`}
                                    aria-selected={isActive}
                                    onClick={() => goTo(index)}
                                    className={`relative flex-shrink-0 w-12 h-9 sm:w-16 sm:h-11 rounded-lg overflow-hidden bg-cover bg-center border-2 transition-all duration-300 ${
                                        isActive
                                            ? 'border-cyan-300 scale-110 shadow-[0_0_0_2px_rgba(103,232,249,0.25)]'
                                            : 'border-white/25 opacity-60 hover:opacity-90 hover:border-white/50'
                                    }`}
                                    style={{ backgroundImage: `url('${s.image}')` }}
                                >
                                    {!isActive && <span className="absolute inset-0 bg-[#050B14]/40" />}
                                    {isActive && (
                                        <span className="absolute left-0 bottom-0 h-[3px] bg-cyan-300/90 w-full origin-left">
                                            <span
                                                className="block h-full bg-white"
                                                style={{
                                                    animation: `heroProgressFill ${AUTOPLAY_MS}ms linear forwards`,
                                                    animationPlayState: isPaused ? 'paused' : 'running',
                                                }}
                                            />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Flechas: navegación tradicional, ancladas a los bordes de la imagen */}
            <button
                type="button"
                aria-label="Slide anterior"
                onClick={() => goTo(currentIndex - 1)}
                className="absolute left-3 md:left-5 lg:left-8 bottom-8 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border border-white/20 bg-[#050B14]/40 hover:bg-[#050B14]/70 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 shadow-lg"
            >
                <ChevronLeft size={26} strokeWidth={2.25} />
            </button>
            <button
                type="button"
                aria-label="Siguiente slide"
                onClick={() => goTo(currentIndex + 1)}
                className="absolute right-20 md:right-5 lg:right-8 bottom-8 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border border-white/20 bg-[#050B14]/40 hover:bg-[#050B14]/70 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 shadow-lg"
            >
                <ChevronRight size={26} strokeWidth={2.25} />
            </button>
        </div>
    );
}
