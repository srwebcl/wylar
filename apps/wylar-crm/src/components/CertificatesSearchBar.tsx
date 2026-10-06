'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: '', label: 'Todos los estados' },
    { value: 'VIGENTE', label: 'Vigente' },
    { value: 'VENCIDO', label: 'Vencido' },
    { value: 'SIN_VENCIMIENTO', label: 'Sin vencimiento' },
    { value: 'REVOCADO', label: 'Revocado' },
];

export function CertificatesSearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const [q, setQ] = useState(searchParams.get('q') ?? '');

    function updateParam(name: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(name, value);
        else params.delete(name);
        params.delete('page');
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }

    return (
        <div className="flex flex-wrap gap-2.5 mb-4">
            <form className="relative group" onSubmit={(e) => { e.preventDefault(); updateParam('q', q); }}>
                <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-[#0B1E40] transition-colors" size={15} />
                <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por nombre, RUT o código..."
                    className="pl-9 pr-3 py-2 w-72 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40]/15 focus:border-[#0B1E40] outline-none text-sm transition-all"
                />
            </form>
            <select
                defaultValue={searchParams.get('status') ?? ''}
                onChange={(e) => updateParam('status', e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:ring-2 focus:ring-[#0B1E40]/15 focus:border-[#0B1E40]"
            >
                {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                        {s.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
