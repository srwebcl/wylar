import Link from 'next/link';
import { leadTypeLabel } from '@/lib/constants';
import { formatChileanMobile } from '@/lib/phone';
import type { Client } from '@prisma/client';

type ClientWithCount = Client & { _count: { opportunities: number } };

export function ClientsTable({ clients }: { clients: ClientWithCount[] }) {
    if (clients.length === 0) {
        return <div className="glass-card p-10 text-center text-slate-500">No hay clientes que coincidan con el filtro.</div>;
    }

    return (
        <div className="space-y-4">
            {/* Vista móvil: tarjetas para pantallas pequeñas (< sm) */}
            <div className="sm:hidden space-y-3">
                {clients.map((c) => {
                    const formattedPhone = formatChileanMobile(c.phone) ?? c.phone;
                    const formattedEmail = c.email.toLowerCase();
                    const formattedName = c.name.toUpperCase();

                    return (
                        <div key={c.id} className="glass-card bg-white p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <Link href={`/clientes/${c.id}`} className="font-extrabold text-[#0B1E40] hover:text-amber-600 transition-colors text-base truncate block">
                                        {formattedName}
                                    </Link>
                                    {c.company && <p className="text-xs text-slate-500 mt-0.5 truncate">{c.company.toUpperCase()}</p>}
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                        {c.rut && <span>RUT: {c.rut}</span>}
                                        <span>·</span>
                                        <span>{leadTypeLabel(c.type)}</span>
                                    </div>
                                </div>
                                <span className="shrink-0 inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                    {c._count.opportunities} {c._count.opportunities === 1 ? 'oportunidad' : 'oportunidades'}
                                </span>
                            </div>

                            {/* Contactos interactivos */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <a
                                    href={`tel:${formattedPhone}`}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                                >
                                    📞 {formattedPhone}
                                </a>
                                <a
                                    href={`mailto:${formattedEmail}`}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors truncate"
                                    title={formattedEmail}
                                >
                                    ✉️ {formattedEmail.split('@')[0]}…
                                </a>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex justify-end">
                                <Link href={`/clientes/${c.id}`} className="font-bold text-xs text-amber-600 hover:text-amber-700">
                                    Ver ficha del cliente →
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Vista desktop/tablet (>= sm) */}
            <div className="hidden sm:block glass-card overflow-hidden">
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
                            {clients.map((c) => {
                                const formattedPhone = formatChileanMobile(c.phone) ?? c.phone;
                                const formattedEmail = c.email.toLowerCase();
                                const formattedName = c.name.toUpperCase();

                                return (
                                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                            <Link href={`/clientes/${c.id}`} className="font-bold text-[#0B1E40] hover:underline">
                                                {formattedName}
                                            </Link>
                                            {c.company && <span className="block text-xs font-normal text-slate-400">{c.company.toUpperCase()}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{c.rut || '—'}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formattedEmail}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formattedPhone}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{leadTypeLabel(c.type)}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c._count.opportunities}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
