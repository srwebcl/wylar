'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';

/**
 * Input con autocompletar: escribe para filtrar las opciones existentes,
 * elige una, o usa la opción "Crear ..." para quedarte con el texto tal
 * cual lo escribiste. Si se pasa `onCreate`, esa función se llama de
 * inmediato al elegir "Crear" (para persistir la opción nueva, ej. una
 * categoría) — si no se pasa, "crear" simplemente deja pasar el texto
 * libre (ej. el nombre de la certificación, que no tiene tabla propia).
 */
export function SearchableCreatableSelect({
    value,
    onChange,
    options,
    onCreate,
    placeholder,
    createLabel = 'Crear',
}: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    onCreate?: (value: string) => Promise<void> | void;
    placeholder?: string;
    createLabel?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value);
    const [creating, setCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const normalizedQuery = query.trim().toLowerCase();
    const filtered = options.filter((o) => o.toLowerCase().includes(normalizedQuery));
    const exactMatch = options.some((o) => o.toLowerCase() === normalizedQuery);

    function selectOption(opt: string) {
        onChange(opt);
        setQuery(opt);
        setOpen(false);
    }

    async function handleCreate() {
        const text = query.trim();
        if (!text) return;
        if (onCreate) {
            setCreating(true);
            try {
                await onCreate(text);
            } finally {
                setCreating(false);
            }
        }
        selectOption(text);
    }

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900"
                    autoComplete="off"
                />
            </div>

            {open && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                    {filtered.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => selectOption(opt)}
                            className="w-full text-left px-3.5 py-2 text-sm text-slate-700 hover:bg-amber-50 transition-colors"
                        >
                            {opt}
                        </button>
                    ))}
                    {filtered.length === 0 && query.trim() === '' && (
                        <p className="px-3.5 py-2 text-sm text-slate-400">Escribe para buscar…</p>
                    )}
                    {query.trim() !== '' && !exactMatch && (
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={creating}
                            className="w-full text-left px-3.5 py-2 text-sm text-amber-700 font-bold hover:bg-amber-50 transition-colors flex items-center gap-1.5 border-t border-slate-100 disabled:opacity-50"
                        >
                            <Plus size={14} /> {creating ? 'Creando…' : `${createLabel} "${query.trim()}"`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
