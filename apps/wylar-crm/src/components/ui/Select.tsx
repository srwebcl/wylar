'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { FloatingPanel, isOutsideFloatingPanel } from '@/components/ui/FloatingPanel';

export interface SelectOption {
    value: string;
    label: string;
}

/**
 * Reemplazo estilizado del <select> nativo del navegador para listas
 * finitas y conocidas (estado, origen, tipo, categoría, responsable...).
 * Funciona dentro de un <form> nativo vía un input oculto (name=), igual
 * que ComunaCombobox/Combobox. Si hay más de ~8 opciones, muestra un
 * buscador interno.
 */
export function Select({
    value = '',
    onChange,
    name,
    required = false,
    placeholder = 'Selecciona...',
    options,
    className = '',
    disabled = false,
}: {
    value?: string;
    onChange?: (val: string) => void;
    name?: string;
    required?: boolean;
    placeholder?: string;
    options: readonly SelectOption[];
    className?: string;
    disabled?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listboxId = useId();

    const showSearch = options.length > 8;
    const filtered = showSearch ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase())) : options;
    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (isOutsideFloatingPanel(e.target as Node, containerRef.current)) setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && showSearch && searchInputRef.current) searchInputRef.current.focus();
    }, [isOpen, showSearch]);

    function handleSelect(opt: SelectOption) {
        onChange?.(opt.value);
        setIsOpen(false);
        setSearch('');
    }

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {name && <input type="hidden" name={name} value={value} required={required} />}

            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm transition-all flex items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 ${
                    disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-100/80'
                }`}
            >
                <span className={`truncate ${selected ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{selected ? selected.label : placeholder}</span>
                <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <FloatingPanel anchorRef={containerRef} open={isOpen} matchWidth>
                <div id={listboxId} role="listbox" className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-full">
                    {showSearch && (
                        <div className="p-2 border-b border-slate-100 bg-slate-50/70 shrink-0">
                            <div className="relative flex items-center">
                                <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar..."
                                    className="w-full pl-7 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 outline-none"
                                />
                            </div>
                        </div>
                    )}
                    <div className="overflow-y-auto p-1 min-h-0 flex-1 overscroll-contain">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-center text-sm text-slate-400">Sin resultados</div>
                        ) : (
                            filtered.map((o) => {
                                const isSelected = o.value === value;
                                return (
                                    <button
                                        key={o.value}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(o)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                            isSelected ? 'bg-amber-50 text-navy-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <span className="text-left leading-snug">{o.label}</span>
                                        {isSelected && <Check size={14} className="shrink-0 text-amber-600" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </FloatingPanel>
        </div>
    );
}
