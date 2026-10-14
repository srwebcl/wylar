import Link from 'next/link';
import { leadTypeLabel } from '@/lib/constants';
import type { Client } from '@prisma/client';

type ClientWithCount = Client & { _count: { opportunities: number } };

export function ClientsTable({ clients }: { clients: ClientWithCount[] }) {
    if (clients.length === 0) {
        return <div className="glass-card p-10 text-center text-slate-500">No hay clientes que coincidan con el filtro.</div>;
    }

    return (
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">RUT</th>
                            <th className="px-4 py-3">Correo</th>
                            <th className="px-4 py-3">Teléfono</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Oportunidades</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {clients.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                    <Link href={`/clientes/${c.id}`} className="font-bold text-[#0B1E40] hover:underline">
                                        {c.name}
                                    </Link>
                                    {c.company && <span className="block text-xs font-normal text-slate-400">{c.company}</span>}
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{c.rut || '—'}</td>
                                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{c.email}</td>
                                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{c.phone}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{leadTypeLabel(c.type)}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c._count.opportunities}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
