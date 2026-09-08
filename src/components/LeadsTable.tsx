import Link from 'next/link';
import { leadTypeLabel, sourceLabel, statusLabel } from '@/lib/constants';
import type { Lead, User } from '@prisma/client';

type LeadWithAssignee = Lead & { assignedTo: User | null };

const STATUS_BADGE: Record<string, string> = {
    NUEVO: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    EN_ATENCION: 'bg-amber-50 text-amber-700 border-amber-200',
    SEGUIMIENTO: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    CERRADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function LeadsTable({ leads }: { leads: LeadWithAssignee[] }) {
    if (leads.length === 0) {
        return (
            <div className="glass-card p-10 text-center text-slate-500">
                No hay prospectos que coincidan con el filtro.
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                            <th className="px-4 py-3">Código</th>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Contacto</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Certificación</th>
                            <th className="px-4 py-3">Origen</th>
                            <th className="px-4 py-3">Responsable</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Ingresó</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3">
                                    <Link href={`/leads/${lead.id}`} className="font-bold text-[#0B1E40] hover:underline">
                                        {lead.code}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-800">
                                    {lead.name}
                                    {lead.company && <span className="block text-xs text-slate-400">{lead.company}</span>}
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs">
                                    <span className="block">{lead.email}</span>
                                    <span className="block">{lead.phone}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{leadTypeLabel(lead.type)}</td>
                                <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{lead.certificationInterest || '—'}</td>
                                <td className="px-4 py-3 text-slate-600">{sourceLabel(lead.source)}</td>
                                <td className="px-4 py-3 text-slate-600">{lead.assignedTo?.name ?? <span className="text-slate-400 italic">Sin asignar</span>}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[lead.status]}`}>
                                        {statusLabel(lead.status)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                    {new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(lead.createdAt))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
