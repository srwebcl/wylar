'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Building2, Clock, GraduationCap, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';
import { changeLeadStatus } from '@/actions/leads';
import { STATUSES, formatDuration, leadTypeLabel, sourceLabel } from '@/lib/constants';
import type { Lead, User } from '@prisma/client';

type LeadWithAssignee = Lead & { assignedTo: User | null };

const COLUMN_STYLES: Record<string, { header: string; dot: string }> = {
    NUEVO: { header: 'text-cyan-700 bg-cyan-50 border-cyan-200', dot: 'bg-cyan-500' },
    EN_ATENCION: { header: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    SEGUIMIENTO: { header: 'text-indigo-700 bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
    CERRADO: { header: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
};

export function KanbanBoard({ leads }: { leads: LeadWithAssignee[] }) {
    const [items, setItems] = useState(leads);
    const [dragId, setDragId] = useState<number | null>(null);
    const [, startTransition] = useTransition();

    const columns = useMemo(() => {
        const byStatus = new Map<string, LeadWithAssignee[]>();
        for (const s of STATUSES) byStatus.set(s.value, []);
        for (const lead of items) {
            byStatus.get(lead.status)?.push(lead);
        }
        return byStatus;
    }, [items]);

    function handleDrop(status: string) {
        if (dragId == null) return;
        const leadId = dragId;
        setDragId(null);

        setItems((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
        startTransition(async () => {
            await changeLeadStatus(leadId, status);
        });
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATUSES.map((col) => {
                const style = COLUMN_STYLES[col.value];
                const leadsInColumn = columns.get(col.value) ?? [];
                return (
                    <div
                        key={col.value}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(col.value)}
                        className="flex flex-col min-h-[400px]"
                    >
                        <div className={clsx('flex items-center justify-between px-4 py-3 rounded-t-xl border font-bold text-sm', style.header)}>
                            <span className="flex items-center gap-2">
                                <span className={clsx('h-2 w-2 rounded-full', style.dot)} />
                                {col.label}
                            </span>
                            <span className="text-xs font-semibold bg-white/70 rounded-full px-2 py-0.5">{leadsInColumn.length}</span>
                        </div>
                        <div className="flex-1 bg-slate-100/60 border border-t-0 border-slate-200 rounded-b-xl p-2 space-y-2">
                            {leadsInColumn.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-8">Sin prospectos en esta etapa.</p>
                            )}
                            {leadsInColumn.map((lead) => (
                                <LeadCard key={lead.id} lead={lead} onDragStart={() => setDragId(lead.id)} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function LeadCard({ lead, onDragStart }: { lead: LeadWithAssignee; onDragStart: () => void }) {
    const waitingSinceMs = Date.now() - new Date(lead.createdAt).getTime();
    const isStaleNew = lead.status === 'NUEVO' && waitingSinceMs > 1000 * 60 * 60 * 4; // 4h sin atender

    return (
        <Link
            href={`/leads/${lead.id}`}
            draggable
            onDragStart={onDragStart}
            className="block bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing"
        >
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="font-bold text-slate-900 text-sm leading-tight truncate">{lead.name}</p>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">{lead.code}</span>
            </div>

            {lead.company && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 truncate">
                    <Building2 size={12} className="shrink-0" /> {lead.company}
                </p>
            )}
            {lead.certificationInterest && (
                <p className="flex items-center gap-1.5 text-xs text-slate-600 mb-2 truncate">
                    <GraduationCap size={12} className="shrink-0 text-[#0B1E40]" /> {lead.certificationInterest}
                </p>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {leadTypeLabel(lead.type)} · {sourceLabel(lead.source)}
                </span>
                {lead.assignedTo ? (
                    <span title={lead.assignedTo.name} className="h-6 w-6 rounded-full bg-[#0B1E40] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {initials(lead.assignedTo.name)}
                    </span>
                ) : (
                    <span title="Sin asignar" className="h-6 w-6 rounded-full bg-slate-100 border border-dashed border-slate-300 text-slate-400 flex items-center justify-center shrink-0">
                        <UserIcon size={12} />
                    </span>
                )}
            </div>

            {isStaleNew && (
                <p className="flex items-center gap-1 text-[11px] font-semibold text-red-600 mt-2">
                    <Clock size={11} /> Sin atender hace {formatDuration(waitingSinceMs)}
                </p>
            )}
        </Link>
    );
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');
}
