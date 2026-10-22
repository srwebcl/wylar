'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { Search, X, ChevronDown, Loader2, type LucideIcon } from 'lucide-react';
import { FloatingPanel, isOutsideFloatingPanel } from '@/components/ui/FloatingPanel';

export interface ComboboxOption {
    id: string | number;
    label: string;
    sublabel?: string;
}

/**
 * Selector con búsqueda propia — reemplaza el <select> nativo para elegir
 * UNA entidad. Dos modos:
 *  - local: filtra `options` ya cargadas en memoria (catálogos acotados,
 *    ej. productos).
 *  - remoto: si se pasa `searchUrl`, hace fetch con debounce a esa URL
 *    (`${searchUrl}?q=...`) en vez de cargar todo de antemano — para
 *    entidades que pueden ser miles (oportunidades, clientes). La URL debe
 *    responder `{ options: ComboboxOption[] }`.
 *
 * Mismo patrón de interacción que ComunaCombobox (combobox/listbox,
 * teclado, input oculto para funcionar dentro de un <form> nativo).
 */
export function Combobox({
    value = null,
    onChange,
    name,
    required = false,
    placeholder = 'Buscar...',
    icon: Icon = Search,
    options,
    searchUrl,
    initialLabel,
    initialSublabel,
    disabled = false,
    className = '',
}: {
    value?: string | number | null;
    onChange?: (id: string | number | null, option?: ComboboxOption) => void;
    name?: string;
    required?: boolean;
    placeholder?: string;
    icon?: LucideIcon;
    options?: ComboboxOption[];
    searchUrl?: string;
    // Permite mostrar la etiqueta de un `value` ya elegido server-side (ej.
    // ?leadId= preseleccionado) sin tener que resolverlo con una búsqueda.
    initialLabel?: string;
    initialSublabel?: string;
    disabled?: boolean;
    className?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [remoteOptions, setRemoteOptions] = useState<ComboboxOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState(initialLabel ?? '');
    const [selectedSublabel, setSelectedSublabel] = useState(initialSublabel ?? '');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listboxId = useId();

    const isRemote = Boolean(searchUrl);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (isOutsideFloatingPanel(e.target as Node, containerRef.current)) setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) searchInputRef.current.focus();
    }, [isOpen]);

    useEffect(() => {
        if (!isRemote || !isOpen) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`${searchUrl}?q=${encodeURIComponent(search)}`);
                const data = await res.json();
                setRemoteOptions(data.options ?? []);
            } catch {
                setRemoteOptions([]);
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, isOpen, isRemote, searchUrl]);

    const localFiltered = (options ?? []).filter((o) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q);
    });
    const shownOptions = isRemote ? remoteOptions : localFiltered;

    function handleSelect(option: ComboboxOption) {
        setSelectedLabel(option.label);
        setSelectedSublabel(option.sublabel ?? '');
        onChange?.(option.id, option);
        setIsOpen(false);
        setSearch('');
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation();
        setSelectedLabel('');
        setSelectedSublabel('');
        onChange?.(null);
        setSearch('');
    }

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {name && <input type="hidden" name={name} value={value ?? ''} required={required} />}

            <div
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        setIsOpen(true);
                    }
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm transition-all flex items-center justify-between text-left focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 outline-none ${
                    disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                }`}
            >
                <div className="flex items-center gap-2 truncate min-w-0">
                    <Icon size={16} className={`shrink-0 ${selectedLabel ? 'text-navy-900' : 'text-slate-400'}`} />
                    {selectedLabel ? (
                        <span className="truncate">
                            <span className="font-semibold text-slate-800">{selectedLabel}</span>
                            {selectedSublabel && <span className="text-slate-400 ml-1.5">{selectedSublabel}</span>}
                        </span>
                    ) : (
                        <span className="text-slate-400 truncate">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {selectedLabel && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors"
                            aria-label="Limpiar selección"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={15} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            <FloatingPanel anchorRef={containerRef} open={isOpen} matchWidth>
                <div id={listboxId} role="listbox" className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                        <div className="relative flex items-center">
                            <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={isRemote ? 'Escribe para buscar...' : 'Buscar...'}
                                className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 outline-none"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 p-1">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                                <Loader2 size={14} className="animate-spin" /> Buscando...
                            </div>
                        ) : shownOptions.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-400">
                                {isRemote && !search ? 'Escribe para buscar' : 'Sin resultados'}
                            </div>
                        ) : (
                            shownOptions.map((o) => {
                                const isSelected = o.id === value;
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(o)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                            isSelected ? 'bg-amber-50 text-navy-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <span className="truncate">{o.label}</span>
                                        {o.sublabel && <span className="text-xs text-slate-400 font-normal shrink-0">{o.sublabel}</span>}
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
