import React, { useState, useMemo } from 'react';
import { ArrowRight, ShieldCheck, Wrench, Users, Construction, Filter, Search } from 'lucide-react';
import { perfiles } from '../data/perfiles.js';

const getCategoryIcon = (category) => {
    switch(category) {
        case 'Construcción': return <Construction size={14} />;
        case 'Industrial': return <Wrench size={14} />;
        case 'Salud': return <Users size={14} />;
        default: return <ShieldCheck size={14} />;
    }
};

export default function CatalogoInteractivo() {
    const [filterTipo, setFilterTipo] = useState('all');
    const [filterPublico, setFilterPublico] = useState('all');
    const [filterArea, setFilterArea] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const areasUnicas = useMemo(() => {
        const areas = new Set(perfiles.map(p => p.category));
        return Array.from(areas);
    }, []);

    const filteredPerfiles = useMemo(() => {
        return perfiles.filter(perfil => {
            // Filter Tipo
            if (filterTipo === 'chilevalora' && !perfil.isChileValora) return false;
            if (filterTipo === 'privada' && perfil.isChileValora) return false;

            // Filter Publico
            if (filterPublico !== 'all' && (!perfil.target || !perfil.target.includes(filterPublico))) return false;

            // Filter Area
            if (filterArea !== 'all' && perfil.category !== filterArea) return false;

            // Search
            if (searchQuery && !perfil.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

            return true;
        });
    }, [filterTipo, filterPublico, filterArea, searchQuery]);

    return (
        <section className="py-12 bg-slate-50 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* SIDEBAR FILTERS */}
                    <div className="w-full lg:w-1/4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
                            <div className="flex items-center gap-2 text-[#0B1E40] font-bold text-lg mb-6 border-b border-slate-100 pb-4">
                                <Filter size={20} /> Filtros de Búsqueda
                            </div>
                            
                            {/* Search */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Buscar</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Ej. Instalador Eléctrico..." 
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                                </div>
                            </div>

                            {/* Tipo Certificación */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tipo de Certificación</label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="tipo" checked={filterTipo === 'all'} onChange={() => setFilterTipo('all')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors font-medium">Todos los tipos</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="tipo" checked={filterTipo === 'chilevalora'} onChange={() => setFilterTipo('chilevalora')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors font-medium">Certificada por ChileValora</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="tipo" checked={filterTipo === 'privada'} onChange={() => setFilterTipo('privada')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors font-medium">Certificación Privada</span>
                                    </label>
                                </div>
                            </div>

                            {/* Público Objetivo */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Público Objetivo</label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="publico" checked={filterPublico === 'all'} onChange={() => setFilterPublico('all')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors font-medium">Ambos</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="publico" checked={filterPublico === 'personas'} onChange={() => setFilterPublico('personas')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors font-medium">Para Personas</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="publico" checked={filterPublico === 'empresas'} onChange={() => setFilterPublico('empresas')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors font-medium">Para Empresas</span>
                                    </label>
                                </div>
                            </div>

                            {/* Área */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Por Área</label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="area" checked={filterArea === 'all'} onChange={() => setFilterArea('all')} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors font-medium">Todas las áreas</span>
                                    </label>
                                    {areasUnicas.map(area => (
                                        <label key={area} className="flex items-center gap-3 cursor-pointer group">
                                            <input type="radio" name="area" checked={filterArea === area} onChange={() => setFilterArea(area)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                                            <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors font-medium">{area}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RESULTS GRID */}
                    <div className="w-full lg:w-3/4">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-extrabold text-[#0B1E40]">Resultados ({filteredPerfiles.length})</h2>
                        </div>
                        
                        {filteredPerfiles.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
                                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-[#0B1E40] mb-2">No se encontraron perfiles</h3>
                                <p className="text-slate-500">Intenta ajustar los filtros de búsqueda para encontrar lo que necesitas.</p>
                                <button 
                                    onClick={() => { setFilterTipo('all'); setFilterPublico('all'); setFilterArea('all'); setSearchQuery(''); }}
                                    className="mt-6 text-blue-600 font-bold hover:underline"
                                >
                                    Limpiar todos los filtros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredPerfiles.map((perfil) => (
                                    <a 
                                        key={perfil.id}
                                        href={perfil.link} 
                                        className={`group flex flex-col bg-white rounded-xl overflow-hidden transition-all duration-300 relative ${
                                            perfil.isChileValora 
                                                ? 'border border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:-translate-y-1' 
                                                : 'border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1'
                                        }`}
                                    >
                                        {/* Imagen */}
                                        <div className="w-full h-48 bg-slate-900 relative overflow-hidden shrink-0">
                                            <img 
                                                src={perfil.image} 
                                                alt={perfil.title} 
                                                className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${!perfil.isChileValora ? 'opacity-90 grayscale group-hover:grayscale-0' : 'opacity-100'}`} 
                                            />
                                            {/* Tag over image */}
                                            <div className="absolute top-4 right-4 z-20">
                                                {perfil.isChileValora ? (
                                                    <span className="bg-cyan-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm border border-white/20">
                                                        Certificada
                                                    </span>
                                                ) : (
                                                    <span className="bg-[#0B1E40]/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm border border-white/10">
                                                        Privada
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Contenido */}
                                        <div className="p-6 flex-1 flex flex-col justify-start">
                                            <div className="flex items-start justify-between mb-4 gap-2">
                                                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${perfil.isChileValora ? 'text-cyan-600' : 'text-blue-600'}`}>
                                                    {getCategoryIcon(perfil.category)} {perfil.category}
                                                </div>
                                                {perfil.isChileValora && (
                                                    <img src="/images/logo-chilevalora.png" alt="ChileValora" className="h-5 object-contain shrink-0" />
                                                )}
                                            </div>
                                            
                                            <h3 className="text-lg font-extrabold text-[#0B1E40] mb-3 leading-tight group-hover:text-blue-700 transition-colors">{perfil.title}</h3>
                                            <p className="text-sm text-slate-600 mb-8 line-clamp-3 leading-relaxed">{perfil.description}</p>
                                            
                                            <div className="mt-auto">
                                                <span className="w-full justify-center relative overflow-hidden group-hover:shadow-blue-900/40 bg-slate-50 group-hover:bg-gradient-to-r group-hover:from-[#0B1E40] group-hover:to-blue-900 text-[#0B1E40] group-hover:text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm font-bold text-sm border border-slate-200 group-hover:border-transparent">
                                                    <span className="relative z-10">Ver Perfil</span>
                                                    <ArrowRight size={16} className="relative z-10" />
                                                </span>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </section>
    );
}
