'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { Search, MapPin, X, ChevronDown } from 'lucide-react';
import { searchComunas } from '@/lib/comunas';

export function ComunaCombobox({
    value = '',
    onChange,
    name = 'comuna',
    required = false,
    placeholder = 'Selecciona o busca tu comuna...',
}: {
    value?: string;
    onChange?: (val: string) => void;
    name?: string;
    required?: boolean;
    placeholder?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listboxId = useId();

    const filtered = searchComunas(search);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    function handleSelect(comunaName: string) {
        if (onChange) onChange(comunaName);
        setIsOpen(false);
        setSearch('');
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation();
        if (onChange) onChange('');
        setSearch('');
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <input type="hidden" name={name} value={value} required={required} />

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
                className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-between text-left focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] outline-none"
            >
                <div className="flex items-center gap-2 truncate min-w-0">
                    <MapPin size={16} className={`shrink-0 ${value ? 'text-[#0B1E40]' : 'text-slate-400'}`} />
                    {value ? (
                        <span className="font-semibold text-slate-800 truncate">{value}</span>
                    ) : (
                        <span className="text-slate-400 text-sm truncate">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors"
                            title="Limpiar selección"
                            aria-label="Limpiar selección"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={15} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div
                    id={listboxId}
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fadeIn"
                >
                    <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                        <div className="relative flex items-center">
                            <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar comuna o región..."
                                className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] outline-none"
                            />
                        </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400 font-medium">
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
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                            isSelected ? 'bg-amber-50 text-[#0B1E40] font-bold' : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <span className="truncate">{c.name}</span>
                                        <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-2">
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
