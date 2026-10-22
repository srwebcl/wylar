'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: '', label: 'Todos los estados' },
    { value: 'BORRADOR', label: 'Borrador' },
    { value: 'ENVIADA', label: 'Enviada' },
    { value: 'ACEPTADA', label: 'Aceptada (Ganada)' },
    { value: 'RECHAZADA', label: 'Rechazada' },
    { value: 'REEMPLAZADA', label: 'Reemplazada (Histórica)' },
];

export function QuotesSearchBar() {
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

    return (
        <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
            <form
                className="relative group flex-1 w-full"
                onSubmit={(e) => {
                    e.preventDefault();
                    updateParam('q', q);
                }}
            >
                <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-[#0B1E40] transition-colors" size={16} />
                <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por código (COT-...), cliente, RUT, empresa..."
                    className="pl-9 pr-3 py-2 w-full bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1E40]/15 focus:border-[#0B1E40] outline-none text-sm transition-all"
                />
            </form>
            <div className="flex items-center gap-2">
                <select
                    defaultValue={searchParams.get('status') ?? ''}
                    onChange={(e) => updateParam('status', e.target.value)}
                    className="w-full sm:w-auto px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#0B1E40]/15 focus:border-[#0B1E40] cursor-pointer"
                >
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
