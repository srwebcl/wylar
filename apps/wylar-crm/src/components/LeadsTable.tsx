'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Trash2, Loader2, ShieldOff } from 'lucide-react';
import { leadTypeLabel, sourceLabel, statusLabel } from '@/lib/constants';
import { deleteLead } from '@/actions/leads';
import type { Lead } from '@prisma/client';
import type { SafeUser as User } from '@/lib/safeUser';

type LeadWithAssignee = Lead & { assignedTo: User | null };

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
        if (!confirm(`¿Eliminar el prospecto ${code} (${name})? Esta acción no se puede deshacer. Queda registrado en la auditoría.`)) return;
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
                No hay prospectos que coincidan con el filtro.
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden">
            {error && <div className="bg-red-50 border-b border-red-100 text-red-700 text-sm px-4 py-3">{error}</div>}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                            <th className="px-4 py-3">Código</th>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Correo</th>
                            <th className="px-4 py-3">Teléfono</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Certificación</th>
                            <th className="px-4 py-3">Origen</th>
                            <th className="px-4 py-3">Responsable</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Hora de Ingreso</th>
                            {isAdmin && <th className="px-4 py-3"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <Link href={`/leads/${lead.id}`} className="font-bold text-[#0B1E40] hover:underline">
                                        {lead.code}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5">
                                        {dncMap.has(`${lead.email}|${lead.phone}`) && (
                                            <span title={`No contactar: ${dncMap.get(`${lead.email}|${lead.phone}`)}`} className="shrink-0">
                                                <ShieldOff size={13} className="text-red-500" />
                                            </span>
                                        )}
                                        {lead.name}
                                    </span>
                                    {lead.company && <span className="block text-xs font-normal text-slate-400">{lead.company}</span>}
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                    {lead.email}
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                    {lead.phone}
                                </td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{leadTypeLabel(lead.type)}</td>
                                <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{lead.certificationInterest || '—'}</td>
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
                                            title="Eliminar prospecto"
                                            className="text-slate-300 hover:text-red-600 disabled:opacity-50 transition-colors"
                                        >
                                            {isPending && pendingId === lead.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
