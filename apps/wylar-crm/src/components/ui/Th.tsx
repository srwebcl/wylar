'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowUp, ArrowDown, ArrowUpDown, Filter } from 'lucide-react';
import { FloatingPanel, isOutsideFloatingPanel } from '@/components/ui/FloatingPanel';

export interface ThFilterConfig {
    type: 'select' | 'text' | 'dateRange';
    paramKey: string;
    options?: { value: string; label: string }[]; // requerido si type === 'select'
    placeholder?: string;
}

/**
 * Encabezado de columna con orden (clic en el label, asc/desc) y filtro
 * propio (ícono de embudo → popover) — estilo HubSpot/Airtable. Lee y
 * escribe el estado en el querystring (mismo patrón que LeadsSearchBar),
 * así que cada page.tsx sigue recibiendo filtros vía `searchParams` sin
 * cambiar su forma de consultar datos.
 */
export function Th({
    label,
    sortKey,
    filter,
    align = 'left',
    className = '',
}: {
    label: string;
    sortKey?: string;
    filter?: ThFilterConfig;
    align?: 'left' | 'right';
    className?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);
    const [textDraft, setTextDraft] = useState(filter?.type === 'text' ? (searchParams.get(filter.paramKey) ?? '') : '');
    const containerRef = useRef<HTMLDivElement>(null);
    const filterBtnRef = useRef<HTMLButtonElement>(null);

    const currentSort = searchParams.get('sort');
    const currentDir = searchParams.get('dir') ?? 'asc';
    const isSorted = Boolean(sortKey) && currentSort === sortKey;

    const filterValue = filter ? (searchParams.get(filter.paramKey) ?? '') : '';
    const filterValueTo = filter?.type === 'dateRange' ? (searchParams.get(`${filter.paramKey}To`) ?? '') : '';
    const hasActiveFilter = Boolean(filterValue) || Boolean(filterValueTo);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (isOutsideFloatingPanel(e.target as Node, containerRef.current)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function updateParams(updates: Record<string, string | null>) {
        const params = new URLSearchParams(searchParams.toString());
        for (const [k, v] of Object.entries(updates)) {
            if (v) params.set(k, v);
            else params.delete(k);
        }
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
    }

    function toggleSort() {
        if (!sortKey) return;
        if (currentSort !== sortKey) updateParams({ sort: sortKey, dir: 'asc' });
        else if (currentDir === 'asc') updateParams({ sort: sortKey, dir: 'desc' });
        else updateParams({ sort: null, dir: null });
    }

    return (
        <th className={`px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
            <div ref={containerRef} className={`relative flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
                <button
                    type="button"
                    onClick={toggleSort}
                    disabled={!sortKey}
                    className={`flex items-center gap-1 transition-colors ${sortKey ? 'hover:text-slate-800 cursor-pointer' : 'cursor-default'}`}
                >
                    {label}
                    {sortKey && (isSorted ? currentDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUpDown size={12} className="text-slate-300" />)}
                </button>

                {filter && (
                    <>
                        <button
                            ref={filterBtnRef}
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className={`p-0.5 rounded transition-colors ${hasActiveFilter ? 'text-navy-900' : 'text-slate-300 hover:text-slate-500'}`}
                            aria-label={`Filtrar por ${label}`}
                        >
                            <Filter size={12} fill={hasActiveFilter ? 'currentColor' : 'none'} />
                        </button>

                        <FloatingPanel anchorRef={filterBtnRef} open={open}>
                            <div
                                className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-56 text-left normal-case font-normal"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {filter.type === 'select' && (
                                    <div className="space-y-0.5 max-h-56 overflow-y-auto">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                updateParams({ [filter.paramKey]: null });
                                                setOpen(false);
                                            }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm ${!filterValue ? 'bg-amber-50 text-navy-900 font-semibold' : 'hover:bg-slate-50 text-slate-600'}`}
                                        >
                                            Todos
                                        </button>
                                        {filter.options?.map((o) => (
                                            <button
                                                key={o.value}
                                                type="button"
                                                onClick={() => {
                                                    updateParams({ [filter.paramKey]: o.value });
                                                    setOpen(false);
                                                }}
                                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm ${filterValue === o.value ? 'bg-amber-50 text-navy-900 font-semibold' : 'hover:bg-slate-50 text-slate-600'}`}
                                            >
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {filter.type === 'text' && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            updateParams({ [filter.paramKey]: textDraft || null });
                                            setOpen(false);
                                        }}
                                        className="space-y-2"
                                    >
                                        <input
                                            autoFocus
                                            type="text"
                                            value={textDraft}
                                            onChange={(e) => setTextDraft(e.target.value)}
                                            placeholder={filter.placeholder ?? 'Buscar...'}
                                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTextDraft('');
                                                    updateParams({ [filter.paramKey]: null });
                                                    setOpen(false);
                                                }}
                                                className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1"
                                            >
                                                Limpiar
                                            </button>
                                            <button type="submit" className="text-xs font-semibold text-navy-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg">
                                                Aplicar
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {filter.type === 'dateRange' && (
                                    <div className="space-y-2">
                                        <label className="block">
                                            <span className="block text-xs font-medium text-slate-500 mb-1">Desde</span>
                                            <input
                                                type="date"
                                                defaultValue={filterValue}
                                                onChange={(e) => updateParams({ [filter.paramKey]: e.target.value || null })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-medium text-slate-500 mb-1">Hasta</span>
                                            <input
                                                type="date"
                                                defaultValue={filterValueTo}
                                                onChange={(e) => updateParams({ [`${filter.paramKey}To`]: e.target.value || null })}
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </FloatingPanel>
                    </>
                )}
            </div>
        </th>
    );
}
