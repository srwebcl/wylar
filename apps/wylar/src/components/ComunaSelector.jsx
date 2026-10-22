import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, MapPin, X, ChevronDown } from 'lucide-react';
import { COMUNAS, searchComunas } from '../lib/comunas.js';

export default function ComunaSelector({
    value = '',
    onChange,
    name = 'comuna',
    required = false,
    placeholder = 'Selecciona o busca tu comuna...',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const listboxId = useId();

    const filtered = searchComunas(search);

    // Cerrar al hacer click afuera
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Foco en el input de búsqueda al abrir
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    function handleSelect(comunaName) {
        if (onChange) onChange(comunaName);
        setIsOpen(false);
        setSearch('');
    }

    function handleClear(e) {
        e.stopPropagation();
        if (onChange) onChange('');
        setSearch('');
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <input type="hidden" name={name} value={value} required={required} />

            {/* Botón trigger principal que simula un input */}
            <div
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                tabIndex={0}
                onClick={() => setIsOpen((prev) => !prev)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        setIsOpen(true);
                    }
                }}
                className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all cursor-pointer flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-2.5 truncate min-w-0">
                    <MapPin size={18} className={`shrink-0 ${value ? 'text-blue-600' : 'text-slate-400'}`} />
                    {value ? (
                        <span className="font-medium text-slate-800 truncate">{value}</span>
                    ) : (
                        <span className="text-slate-400 text-sm truncate">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors"
                            title="Limpiar selección"
                            aria-label="Limpiar selección"
                        >
                            <X size={15} />
                        </button>
                    )}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown flotante con buscador integrado */}
            {isOpen && (
                <div
                    id={listboxId}
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fadeIn"
                >
                    {/* Barra de búsqueda */}
                    <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
                        <div className="relative flex items-center">
                            <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Escribe para buscar comuna o región..."
                                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                            />
                        </div>
                    </div>

                    {/* Lista scrollable de comunas */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1">
                        {filtered.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                No se encontraron comunas para &ldquo;{search}&rdquo;
                            </div>
                        ) : (
                            filtered.map((c) => {
                                const isSelected = c.name === value;
                                return (
                                    <button
                                        key={c.name}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(c.name)}
                                        className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors cursor-pointer ${
                                            isSelected ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <span className="truncate">{c.name}</span>
                                        <span className="text-[11px] text-slate-400 font-normal shrink-0 ml-2">
                                            {c.region}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
