'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { SOURCES, STATUSES } from '@/lib/constants';
import type { User } from '@prisma/client';

export function LeadsSearchBar({ users }: { users: User[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const [q, setQ] = useState(searchParams.get('q') ?? '');
    const [showFilters, setShowFilters] = useState(Boolean(searchParams.get('status') || searchParams.get('source') || searchParams.get('assignedToId')));

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

    const hasFilters = Boolean(searchParams.get('q') || searchParams.get('status') || searchParams.get('source') || searchParams.get('assignedToId'));

    return (
        <div className="space-y-3 mb-5">
            <div className="flex flex-wrap gap-3">
                <form className="relative group" onSubmit={(e) => { e.preventDefault(); updateParam('q', q); }}>
                    <Search className="absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-[#0B1E40] transition-colors" size={18} />
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por nombre, correo, teléfono o código..."
                        className="pl-10 pr-4 py-2.5 w-80 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] outline-none text-sm transition-all shadow-sm"
                    />
                </form>
                <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    className="flex items-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm shadow-sm"
                >
                    <Filter size={16} className="mr-2" /> Filtrar
                </button>
                {hasFilters && (
                    <button type="button" onClick={clearFilters} className="flex items-center px-3 py-2.5 text-slate-500 hover:text-red-600 text-sm font-medium">
                        <X size={16} className="mr-1" /> Limpiar
                    </button>
                )}
            </div>

            {showFilters && (
                <div className="flex flex-wrap gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Estado</label>
                        <select defaultValue={searchParams.get('status') ?? ''} onChange={(e) => updateParam('status', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                            <option value="">Todos</option>
                            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Origen</label>
                        <select defaultValue={searchParams.get('source') ?? ''} onChange={(e) => updateParam('source', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                            <option value="">Todos</option>
                            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Responsable</label>
                        <select defaultValue={searchParams.get('assignedToId') ?? ''} onChange={(e) => updateParam('assignedToId', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
                            <option value="">Todos</option>
                            <option value="sin-asignar">Sin asignar</option>
                            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
