import React, { useState, useEffect } from 'react';
import { Users, Building2, Mail, Phone, ShieldCheck, Handshake, Menu, X } from 'lucide-react';

function FacebookIcon({ size = 14, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

function InstagramIcon({ size = 14, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
    );
}

export default function Header({ currentPath = '/' }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path) => currentPath === path;

    return (
        <div className="sticky top-0 z-[100] w-full flex flex-col shadow-sm">
            {/* NAVBAR SECUNDARIO (TOP BAR) */}
            <div className="bg-gradient-to-r from-[#0B1E40] to-blue-900 text-slate-200 text-[13px] py-1.5 hidden md:block border-b border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4 lg:gap-5">
                        <a href="/personas" className={`flex items-center gap-2 px-3.5 py-1 rounded-full transition-all duration-300 ${isActive('/personas') ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:bg-white/10 hover:text-white'}`}>
                            <Users size={14} /> Personas
                        </a>
                        <a href="/empresas" className={`flex items-center gap-2 px-3.5 py-1 rounded-full transition-all duration-300 ${isActive('/empresas') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'hover:bg-white/10 hover:text-white'}`}>
                            <Building2 size={14} /> Empresas
                        </a>
                        <a href="/otec" className={`flex items-center gap-2 px-3.5 py-1 rounded-full transition-all duration-300 ${isActive('/otec') ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'hover:bg-white/10 hover:text-white'}`}>
                            <Handshake size={14} /> OTEC
                        </a>
                        <a href="/instituciones" className={`flex items-center gap-2 px-3.5 py-1 rounded-full transition-all duration-300 ${isActive('/instituciones') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'hover:bg-white/10 hover:text-white'}`}>
                            <ShieldCheck size={14} /> Instituciones de Educación
                        </a>
                    </div>
                    <div className="flex items-center gap-5 font-semibold">
                        <a href="mailto:contacto@wylar.cl" className="flex items-center gap-2 hover:text-white transition-colors">
                            <Mail size={14} className="text-cyan-400" /> contacto@wylar.cl
                        </a>
                        <a href="tel:+56929566326" className="flex items-center gap-2 hover:text-white transition-colors">
                            <Phone size={14} className="text-cyan-400" /> +56 9 2956 6326
                        </a>
                        <span className="h-4 w-px bg-white/20" aria-hidden="true"></span>
                        <div className="flex items-center gap-2">
                            <a
                                href="https://www.facebook.com/wylar.cl"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook de Wylar"
                                title="Facebook @wylar.cl"
                                className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#1877F2] text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                            >
                                <FacebookIcon size={14} />
                            </a>
                            <a
                                href="https://www.instagram.com/wylar.cl"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram de Wylar"
                                title="Instagram @wylar.cl"
                                className="w-7 h-7 rounded-full bg-white/10 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                            >
                                <InstagramIcon size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN HEADER */}
            <header className={`sticky top-0 w-full transition-all duration-500 z-50 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-2' : 'bg-white py-3'}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-amber-500"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-3 group relative">
                        <div className="absolute -inset-4 bg-blue-100 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                        <img src="/images/logo.webp" alt="Wylar Logo" className="h-9 lg:h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-105 relative z-10" />
                    </a>

                    {/* Desktop Main Nav */}
                    <nav className="hidden md:flex items-center gap-1 font-medium uppercase tracking-wider text-[12px] lg:text-[13px] text-slate-600">
                        <a href="/" className={`px-4 py-2 rounded-full transition-all duration-300 ${isActive('/') ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 hover:text-blue-600'}`}>
                            Inicio
                        </a>

                        <a href="/catalogo" className={`px-4 py-2 rounded-full transition-all duration-300 ${isActive('/catalogo') ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 hover:text-blue-600'}`}>
                            Catálogo
                        </a>

                        <a href="/chilevalora" className={`px-4 py-2 rounded-full transition-all duration-300 ${isActive('/chilevalora') ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 hover:text-blue-600'}`}>
                            Sobre ChileValora
                        </a>

                        <a href="/contacto" className={`px-4 py-2 rounded-full transition-all duration-300 ${isActive('/contacto') ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 hover:text-blue-600'}`}>
                            Contacto
                        </a>

                        <a href="/validador" className="relative overflow-hidden group bg-gradient-to-r from-[#0B1E40] to-blue-900 hover:from-blue-900 hover:to-blue-700 text-white px-5 py-2 rounded-full flex items-center gap-2 transition-all shadow-md hover:shadow-blue-900/20 hover:-translate-y-0.5 font-bold tracking-normal normal-case text-[13px] ml-4">
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                            <ShieldCheck size={16} className="relative z-10" />
                            <span className="relative z-10">Validar Certificado</span>
                        </a>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                    </button>
                </div>

                {/* Mobile Nav Menu (Full Screen) */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white/95 backdrop-blur-3xl px-6 py-8 flex flex-col gap-5 shadow-2xl absolute w-full h-[calc(100vh-80px)] overflow-y-auto left-0 animate-in fade-in slide-in-from-top-4 duration-300 z-50 border-t border-slate-100">
                        <div className="text-xs font-black text-blue-500 uppercase tracking-widest px-3 mb-2">Menú Principal</div>
                        <a href="/" className="font-black text-slate-800 text-2xl px-4 py-3 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-colors">Inicio</a>
                        <a href="/catalogo" className="font-black text-slate-800 text-2xl px-4 py-3 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-colors">Catálogo</a>
                        <a href="/chilevalora" className="font-black text-slate-800 text-2xl px-4 py-3 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-colors">Sobre Chile Valora</a>
                        <a href="/contacto" className="font-black text-slate-800 text-2xl px-4 py-3 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-colors">Contacto</a>
                        
                        <div className="h-px bg-slate-200 w-full my-4"></div>
                        <div className="text-xs font-black text-blue-500 uppercase tracking-widest px-3 mb-2">Portales de Atención</div>
                        <a href="/personas" className="font-bold text-slate-700 text-xl px-4 py-3 hover:bg-slate-100 rounded-2xl transition-colors flex items-center gap-4"><Users size={24} className="text-blue-600" /> Personas</a>
                        <a href="/empresas" className="font-bold text-slate-700 text-xl px-4 py-3 hover:bg-slate-100 rounded-2xl transition-colors flex items-center gap-4"><Building2 size={24} className="text-blue-600" /> Empresas</a>
                        <a href="/otec" className="font-bold text-slate-700 text-xl px-4 py-3 hover:bg-slate-100 rounded-2xl transition-colors flex items-center gap-4"><Handshake size={24} className="text-violet-500" /> OTEC</a>
                        <a href="/instituciones" className="font-bold text-slate-700 text-xl px-4 py-3 hover:bg-slate-100 rounded-2xl transition-colors flex items-center gap-4"><ShieldCheck size={24} className="text-amber-500" /> Instituciones de Educación</a>
                        <div className="h-px bg-slate-200 w-full my-2"></div>
                        <div className="text-xs font-black text-blue-500 uppercase tracking-widest px-3 mb-1">Contacto y Redes Sociales</div>
                        <div className="flex flex-col gap-3 px-3 text-slate-700 font-semibold text-sm">
                            <a href="mailto:contacto@wylar.cl" className="flex items-center gap-3 hover:text-blue-600 transition-colors">
                                <Mail size={18} className="text-blue-600" /> contacto@wylar.cl
                            </a>
                            <a href="tel:+56929566326" className="flex items-center gap-3 hover:text-blue-600 transition-colors">
                                <Phone size={18} className="text-blue-600" /> +56 9 2956 6326
                            </a>
                            <div className="flex items-center gap-3 mt-1">
                                <a
                                    href="https://www.facebook.com/wylar.cl"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Facebook de Wylar"
                                    title="Facebook @wylar.cl"
                                    className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors"
                                >
                                    <FacebookIcon size={18} />
                                </a>
                                <a
                                    href="https://www.instagram.com/wylar.cl"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram de Wylar"
                                    title="Instagram @wylar.cl"
                                    className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white transition-colors"
                                >
                                    <InstagramIcon size={18} />
                                </a>
                            </div>
                        </div>

                        <div className="mt-4 pb-12">
                            <a href="/validador" className="bg-gradient-to-r from-[#0B1E40] to-blue-900 text-white font-black text-lg p-5 rounded-full flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(11,30,64,0.3)] w-full relative overflow-hidden group">
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                <ShieldCheck size={24} className="relative z-10" />
                                <span className="relative z-10">Validar Certificado</span>
                            </a>
                        </div>
                    </div>
                )}
            </header>
        </div>
    );
}
