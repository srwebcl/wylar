'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { LEAD_TYPES } from '@/lib/constants';

export function ClientsSearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const [q, setQ] = useState(searchParams.get('q') ?? '');

    function updateParam(name: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(name, value);
        else params.delete(name);
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }

    const hasFilters = Boolean(searchParams.get('q') || searchParams.get('type'));

    return (
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-5">
            <form className="relative group flex-1 w-full" onSubmit={(e) => { e.preventDefault(); updateParam('q', q); }}>
                <Search className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-[#0B1E40] transition-colors" size={18} />
                <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por nombre, RUT, correo o teléfono..."
                    className="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] outline-none text-sm transition-all shadow-xs"
                />
            </form>
            <div className="flex items-center gap-2">
                <select
                    defaultValue={searchParams.get('type') ?? ''}
                    onChange={(e) => updateParam('type', e.target.value)}
                    className="flex-1 sm:flex-none p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-xs text-slate-700 font-medium"
                >
                    <option value="">Todos los tipos</option>
                    {LEAD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={() => {
                            setQ('');
                            startTransition(() => router.push(pathname));
                        }}
                        className="flex items-center px-3 py-2.5 text-slate-500 hover:text-red-600 text-sm font-medium transition-colors shrink-0"
                    >
                        <X size={16} className="mr-1" /> Limpiar
                    </button>
                )}
            </div>
        </div>
    );
}
