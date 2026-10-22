'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { SOURCES, STATUSES, LEAD_TYPES } from '@/lib/constants';
import type { SafeUser as User } from '@/lib/safeUser';

const FILTER_KEYS = ['type', 'status', 'source', 'assignedToId', 'categoryId', 'productId', 'comuna', 'from', 'to'];

export function LeadsSearchBar({
    users,
    categories = [],
    products = [],
    sources = [],
}: {
    users: User[];
    categories?: { id: number; name: string }[];
    products?: { id: number; name: string; categoryId: number }[];
    sources?: { id: number; name: string }[];
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const [q, setQ] = useState(searchParams.get('q') ?? '');
    const [showFilters, setShowFilters] = useState(FILTER_KEYS.some((k) => searchParams.get(k)));

    function updateParam(name: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(name, value);
        else params.delete(name);
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }

    function clearFilters() {
        setQ('');
        startTransition(() => router.push(pathname));
    }

    const hasFilters = Boolean(searchParams.get('q')) || FILTER_KEYS.some((k) => searchParams.get(k));
    const categoryId = searchParams.get('categoryId') ?? '';
    const filteredProducts = categoryId ? products.filter((p) => String(p.categoryId) === categoryId) : products;

    return (
        <div className="space-y-3 mb-5">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <form className="relative group flex-1 w-full" onSubmit={(e) => { e.preventDefault(); updateParam('q', q); }}>
                    <Search className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-[#0B1E40] transition-colors" size={18} />
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por nombre, RUT, correo, teléfono, certificación, tipo o código..."
                        className="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] outline-none text-sm transition-all shadow-xs"
                    />
                </form>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowFilters((v) => !v)}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm shadow-xs"
                    >
                        <Filter size={16} className="mr-2 text-slate-500" />
                        <span>Filtros</span>
                        {hasFilters && <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-500" />}
                    </button>
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="flex items-center justify-center px-3 py-2.5 text-slate-500 hover:text-red-600 text-sm font-medium transition-colors"
                        >
                            <X size={16} className="mr-1" /> Limpiar
                        </button>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Cliente</label>
                        <select defaultValue={searchParams.get('type') ?? ''} onChange={(e) => updateParam('type', e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                            <option value="">Todos</option>
                            {LEAD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Estado</label>
                        <select defaultValue={searchParams.get('status') ?? ''} onChange={(e) => updateParam('status', e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                            <option value="">Todos</option>
                            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Origen</label>
                        <select defaultValue={searchParams.get('source') ?? ''} onChange={(e) => updateParam('source', e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                            <option value="">Todos</option>
                            {Array.from(new Set([...sources.map((s) => s.name), ...SOURCES.map((s) => s.value)])).map((val) => {
                                const matched = SOURCES.find((s) => s.value === val);
                                return <option key={val} value={val}>{matched?.label ?? val}</option>;
                            })}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Responsable</label>
                        <select defaultValue={searchParams.get('assignedToId') ?? ''} onChange={(e) => updateParam('assignedToId', e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                            <option value="">Todos</option>
                            <option value="sin-asignar">Sin asignar</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Categoría</label>
                        <select
                            defaultValue={categoryId}
                            onChange={(e) => {
                                updateParam('categoryId', e.target.value);
                                updateParam('productId', '');
                            }}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                        >
                            <option value="">Todas</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Producto</label>
                        <select defaultValue={searchParams.get('productId') ?? ''} onChange={(e) => updateParam('productId', e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                            <option value="">Todos</option>
                            {filteredProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Comuna</label>
                        <input
                            type="text"
                            defaultValue={searchParams.get('comuna') ?? ''}
                            onBlur={(e) => updateParam('comuna', e.target.value)}
                            placeholder="Ej: Calama"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Desde</label>
                        <input type="date" defaultValue={searchParams.get('from') ?? ''} onChange={(e) => updateParam('from', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Hasta</label>
                        <input type="date" defaultValue={searchParams.get('to') ?? ''} onChange={(e) => updateParam('to', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
                    </div>
                </div>
            )}
        </div>
    );
}
