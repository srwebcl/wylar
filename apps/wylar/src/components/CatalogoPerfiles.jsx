import React from 'react';
import { ArrowRight, ShieldCheck, Wrench, Users, Construction, BookOpen } from 'lucide-react';
import { perfiles } from '../data/perfiles.js';

const getCategoryIcon = (category) => {
    switch(category) {
        case 'Construcción': return <Construction size={14} />;
        case 'Industrial': return <Wrench size={14} />;
        case 'Salud': return <Users size={14} />;
        default: return <ShieldCheck size={14} />;
    }
};

export default function CatalogoPerfiles({ featuredOnly = false, title = '', subtitle = '' }) {
    
    const displayedPerfiles = featuredOnly 
        ? perfiles.filter(p => p.isFeatured)
        : perfiles;

    return (
        <section className="py-24 bg-slate-50/50 border-t border-slate-100 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Cabecera Unificada (Centrada) */}
                <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-8 h-px bg-blue-600/30"></span>
                        <span className="flex items-center gap-2 text-blue-700 text-sm font-bold tracking-[0.2em] uppercase">
                            <BookOpen size={16} /> Nuestro Catálogo
                        </span>
                        <span className="w-8 h-px bg-blue-600/30"></span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1E40] mb-5 tracking-tight">
                        {title ? title : (
                            <>¿Qué certificación <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B1E40] to-blue-800">necesitas?</span></>
                        )}
                    </h2>
                    <p className="text-base md:text-lg text-slate-600">
                        {subtitle || 'Conoce los perfiles que puedes certificar con Wylar. Contamos con certificaciones reconocidas por ChileValora y certificaciones privadas para distintos sectores productivos.'}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {displayedPerfiles.map((perfil) => (
                        <a 
                            key={perfil.id}
                            href={perfil.link} 
                            className={`group flex flex-col sm:flex-row bg-slate-50 rounded-xl overflow-hidden transition-all duration-300 relative ${
                                perfil.isChileValora 
                                    ? 'border border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
                                    : 'border border-slate-200 hover:border-blue-300 hover:shadow-lg'
                            }`}
                        >
                            {/* Imagen */}
                            <div className="w-full sm:w-2/5 h-48 sm:h-auto bg-slate-900 relative overflow-hidden shrink-0">
                                <img 
                                    src={perfil.image} 
                                    alt={perfil.title} 
                                    className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${!perfil.isChileValora ? 'opacity-80 grayscale group-hover:grayscale-0' : 'opacity-95'}`} 
                                />
                            </div>
                            
                            {/* Contenido */}
                            <div className="p-6 w-full sm:w-3/5 flex flex-col justify-center bg-white">
                                {/* Header del contenido con la categoría y el logo */}
                                <div className="flex items-start justify-between mb-3 gap-2">
                                    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${perfil.isChileValora ? 'text-cyan-600' : 'text-blue-600'}`}>
                                        {getCategoryIcon(perfil.category)} {perfil.category}
                                    </div>
                                    {perfil.isChileValora ? (
                                        <div className="bg-white rounded-lg p-1.5 shadow-sm border border-slate-100">
                                            <img src="/images/logo-chilevalora.png" alt="ChileValora" className="h-8 md:h-10 object-contain shrink-0" />
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-lg px-2.5 py-1.5 shadow-sm border border-slate-100 flex items-center gap-1.5">
                                            <ShieldCheck size={14} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Privada</span>
                                        </div>
                                    )}
                                </div>
                                
                                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-700 transition-colors">{perfil.title}</h3>
                                <p className="text-sm text-slate-600 mb-6 line-clamp-3">{perfil.description}</p>
                                
                                <div className="mt-auto">
                                    <span className="relative overflow-hidden group-hover:shadow-blue-900/40 bg-gradient-to-r from-[#0B1E40] to-blue-900 text-white px-6 py-2.5 rounded-full inline-flex items-center gap-2 transition-all shadow-md font-bold text-sm group-hover:-translate-y-0.5">
                                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                        <span className="relative z-10">Ver Perfil</span>
                                        <ArrowRight size={16} className="relative z-10" />
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                {featuredOnly && (
                    <div className="mt-16 flex justify-center">
                        <a href="/catalogo" className="relative overflow-hidden group bg-gradient-to-r from-[#0B1E40] to-blue-900 hover:from-blue-900 hover:to-blue-700 text-white px-10 py-4 rounded-full flex items-center gap-3 transition-all shadow-xl hover:shadow-blue-900/40 hover:-translate-y-0.5 font-bold text-lg">
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                            <span className="relative z-10">Ver Catálogo Completo</span>
                            <ArrowRight size={20} className="relative z-10" />
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
}
