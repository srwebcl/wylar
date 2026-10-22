'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Trash2, Loader2, ShieldOff, Contact, MapPin } from 'lucide-react';
import { leadTypeLabel, sourceLabel, statusLabel } from '@/lib/constants';
import { deleteLead } from '@/actions/leads';
import { formatChileanMobile } from '@/lib/phone';
import type { Lead, Product, ProductCategory } from '@prisma/client';
import type { SafeUser as User } from '@/lib/safeUser';

type LeadWithAssignee = Lead & { assignedTo: User | null; product: (Product & { category: ProductCategory }) | null };

const STATUS_BADGE: Record<string, string> = {
    NUEVO: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    EN_ATENCION: 'bg-amber-50 text-amber-700 border-amber-200',
    SEGUIMIENTO: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    CERRADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DESISTIDO: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function LeadsTable({ leads, isAdmin = false, dncMap = new Map() }: { leads: LeadWithAssignee[]; isAdmin?: boolean; dncMap?: Map<string, string> }) {
    const [isPending, startTransition] = useTransition();
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    function handleDelete(id: number, code: string, name: string) {
        if (!confirm(`¿Eliminar la oportunidad ${code} (${name})? Esta acción no se puede deshacer. Queda registrado en la auditoría.`)) return;
        setError(null);
        setPendingId(id);
        startTransition(async () => {
            const result = await deleteLead(id);
            if (result.error) setError(result.error);
            setPendingId(null);
        });
    }

    if (leads.length === 0) {
        return (
            <div className="glass-card p-10 text-center text-slate-500">
                No hay oportunidades que coincidan con el filtro.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

            {/* Vista móvil: tarjetas optimizadas para pantallas táctiles (< lg) */}
            <div className="lg:hidden space-y-3">
                {leads.map((lead) => {
                    const isDnc = dncMap.has(`${lead.email}|${lead.phone}`);
                    const formattedPhone = formatChileanMobile(lead.phone) ?? lead.phone;
                    const formattedEmail = lead.email.toLowerCase();
                    const formattedName = lead.name.toUpperCase();

                    return (
                        <div key={lead.id} className="glass-card bg-white p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link href={`/leads/${lead.id}`} className="font-extrabold text-[#0B1E40] hover:text-amber-600 transition-colors text-base truncate">
                                            {formattedName}
                                        </Link>
                                        {isDnc && (
                                             <span title={`No contactar: ${dncMap.get(`${lead.email}|${lead.phone}`)}`} className="shrink-0">
                                                <ShieldOff size={14} className="text-red-500" />
                                            </span>
                                        )}
                                        <Link href={`/clientes/${lead.clientId}`} title="Ver ficha del cliente" className="text-slate-400 hover:text-[#0B1E40] transition-colors">
                                            <Contact size={14} />
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                                        <span className="font-mono font-bold text-slate-600">{lead.code}</span>
                                        {lead.rut && <span>· {lead.rut}</span>}
                                        {lead.comuna && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                                <MapPin size={11} className="text-slate-400" /> {lead.comuna}
                                            </span>
                                        )}
                                        {lead.company && <span className="truncate">· {lead.company.toUpperCase()}</span>}
                                    </div>
                                </div>
                                <span className={`shrink-0 inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[lead.status]}`}>
                                    {statusLabel(lead.status)}
                                </span>
                            </div>

                            {/* Producto o servicio */}
                            <div className="bg-slate-50 rounded-lg p-2.5 text-xs">
                                <span className="text-slate-400 font-medium">Producto: </span>
                                <span className="font-bold text-slate-800">{lead.product?.name ?? lead.certificationInterest ?? 'No especificado'}</span>
                                {lead.product?.category && <span className="text-slate-500"> ({lead.product.category.name})</span>}
                            </div>

                            {/* Datos de contacto interactivos */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <a
                                    href={`tel:${lead.phone}`}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    📞 {formattedPhone}
                                </a>
                                <a
                                    href={`mailto:${formattedEmail}`}
                                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors truncate"
                                    title={formattedEmail}
                                >
                                    ✉️ {formattedEmail.split('@')[0]}…
                                </a>
                            </div>

                            {/* Footer de la tarjeta */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-medium">Resp:</span>
                                    <span className="text-slate-700 font-semibold truncate">{lead.assignedTo?.name ?? 'Sin asignar'}</span>
                                    <span className="text-slate-300">·</span>
                                    <span>{sourceLabel(lead.source)}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <Link href={`/leads/${lead.id}`} className="font-bold text-xs text-amber-600 hover:text-amber-700">
                                        Ver ficha →
                                    </Link>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(lead.id, lead.code, lead.name)}
                                            disabled={isPending && pendingId === lead.id}
                                            title="Eliminar oportunidad"
                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            {isPending && pendingId === lead.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Vista desktop: tabla completa tradicional (>= lg) */}
            <div className="hidden lg:block glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">RUT</th>
                                <th className="px-4 py-3">Correo</th>
                                <th className="px-4 py-3">Teléfono</th>
                                <th className="px-4 py-3">Comuna</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Producto</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3">Origen</th>
                                <th className="px-4 py-3">Responsable</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">Hora de Ingreso</th>
                                {isAdmin && <th className="px-4 py-3"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leads.map((lead) => {
                                const formattedPhone = formatChileanMobile(lead.phone) ?? lead.phone;
                                const formattedEmail = lead.email.toLowerCase();
                                const formattedName = lead.name.toUpperCase();

                                return (
                                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <Link href={`/leads/${lead.id}`} className="font-bold text-[#0B1E40] hover:underline">
                                                {lead.code}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5">
                                                {dncMap.has(`${lead.email}|${lead.phone}`) && (
                                                    <span title={`No contactar: ${dncMap.get(`${lead.email}|${lead.phone}`)}`} className="shrink-0">
                                                        <ShieldOff size={13} className="text-red-500" />
                                                    </span>
                                                )}
                                                {formattedName}
                                                <Link href={`/clientes/${lead.clientId}`} title="Ver ficha del cliente" className="text-slate-300 hover:text-[#0B1E40] transition-colors">
                                                    <Contact size={13} />
                                                </Link>
                                            </span>
                                            {lead.company && <span className="block text-xs font-normal text-slate-400">{lead.company.toUpperCase()}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                            {lead.rut || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                                            {formattedEmail}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 text-xs font-medium whitespace-nowrap">
                                            {formattedPhone}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                                            {lead.comuna ? (
                                                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{lead.comuna}</span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{leadTypeLabel(lead.type)}</td>
                                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{lead.product?.name ?? lead.certificationInterest ?? '—'}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{lead.product?.category.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{sourceLabel(lead.source)}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.assignedTo?.name ?? <span className="text-slate-400 italic">Sin asignar</span>}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[lead.status]}`}>
                                                {statusLabel(lead.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                            {new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(lead.createdAt))}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(lead.id, lead.code, lead.name)}
                                                    disabled={isPending && pendingId === lead.id}
                                                    title="Eliminar oportunidad"
                                                    className="text-slate-300 hover:text-red-600 disabled:opacity-50 transition-colors cursor-pointer"
                                                >
                                                    {isPending && pendingId === lead.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </td>
                                        )}
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
