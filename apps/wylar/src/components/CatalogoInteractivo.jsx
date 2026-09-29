import React, { useState, useMemo } from 'react';
import { ArrowRight, ShieldCheck, Wrench, Users, Construction, Filter, Search, X } from 'lucide-react';

const getCategoryIcon = (category) => {
    switch(category) {
        case 'Construcción': return <Construction size={14} />;
        case 'Industrial': return <Wrench size={14} />;
        case 'Salud': return <Users size={14} />;
        default: return <ShieldCheck size={14} />;
    }
};

export default function CatalogoInteractivo({ perfiles = [] }) {
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [filterTipo, setFilterTipo] = useState('all');
    const [filterPublico, setFilterPublico] = useState('all');
    const [filterArea, setFilterArea] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Prevent scroll when modal is open
    React.useEffect(() => {
        if (isMobileFiltersOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileFiltersOpen]);

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
        <section className="pb-16 pt-4 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex flex-col gap-8">
                    
                    {/* SIDEBAR FILTERS */}
                    {/* BACKDROP */}
                    {isMobileFiltersOpen && (
                        <div 
                            className="fixed inset-0 bg-slate-900/50 z-[999]" 
                            onClick={() => setIsMobileFiltersOpen(false)} 
                        />
                    )}
                    
                    <div className={`fixed inset-y-0 left-0 z-[1000] w-[85%] max-w-sm bg-white p-6 shadow-2xl overflow-y-auto transform transition-transform duration-300 ${isMobileFiltersOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <div className="bg-white">
                            <div className="flex items-center justify-between text-[#0B1E40] font-bold text-lg mb-6 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <Filter size={20} /> Filtros
                                </div>
                                <button 
                                    className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
                                    onClick={() => setIsMobileFiltersOpen(false)}
                                >
                                    <X size={18} />
                                </button>
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
                    <div className="w-full">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-extrabold text-[#0B1E40]">Resultados ({filteredPerfiles.length})</h2>
                            <button 
                                onClick={() => setIsMobileFiltersOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-colors rounded-full shadow-sm text-[#0B1E40] font-bold text-sm"
                            >
                                <Filter size={16} /> 
                                Filtros
                            </button>
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {filteredPerfiles.map((perfil) => (
                                    <a
                                        key={perfil.id}
                                        href={perfil.link}
                                        className={`group flex flex-col sm:flex-row bg-transparent sm:bg-slate-50 rounded-xl overflow-hidden transition-all duration-300 relative aspect-[4/5] sm:aspect-auto ${
                                            perfil.isChileValora
                                                ? 'border border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                                                : 'border border-slate-200 hover:border-blue-300 hover:shadow-lg'
                                        }`}
                                    >
                                        {/* Imagen */}
                                        <div className="absolute inset-0 sm:relative sm:w-2/5 sm:h-auto bg-slate-900 overflow-hidden shrink-0 z-0">
                                            <img
                                                src={perfil.cardImage || perfil.image}
                                                alt={perfil.title}
                                                className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 opacity-95"
                                            />
                                            {/* Overlay móvil: oscuro solo donde vive el texto (mitad inferior),
                                                dejando la parte superior de la foto clara — como un póster, no un
                                                velo parejo sobre toda la imagen. */}
                                            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.88)_32%,rgba(2,6,23,0.5)_50%,rgba(2,6,23,0.05)_68%,transparent_80%)] sm:hidden z-10"></div>
                                        </div>

                                        {/* Contenido — en mobile, categoría/sello arriba y ficha abajo, con la
                                            foto respirando entre ambos (tarjeta vertical tipo post). */}
                                        <div className="p-5 sm:p-6 w-full sm:w-3/5 h-full sm:h-auto flex flex-col justify-between sm:justify-center bg-transparent sm:bg-white relative z-10">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none sm:px-0 sm:py-0 ${perfil.isChileValora ? 'text-cyan-300 sm:text-cyan-600' : 'text-blue-200 sm:text-blue-600'}`}>
                                                    {getCategoryIcon(perfil.category)} {perfil.category}
                                                </div>
                                                {perfil.isChileValora ? (
                                                    <div className="bg-white rounded-lg p-1.5 shadow-sm border border-slate-100 shrink-0">
                                                        <img src="/images/logo-chilevalora.png" alt="ChileValora" className="h-8 md:h-10 object-contain shrink-0" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg px-2.5 py-1.5 shadow-md flex items-center gap-1.5 shrink-0">
                                                        <ShieldCheck size={14} className="text-white" />
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Privada</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-bold text-white sm:text-slate-900 mb-2 leading-tight group-hover:text-cyan-100 sm:group-hover:text-blue-700 transition-colors">{perfil.title}</h3>
                                                <p className="text-sm text-slate-200 sm:text-slate-600 mb-6 line-clamp-3">{perfil.description}</p>

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
                        )}
                    </div>

                </div>
            </div>
        </section>
    );
}
