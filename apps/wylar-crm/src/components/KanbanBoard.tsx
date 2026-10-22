'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Building2, Clock, GraduationCap, User as UserIcon, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { changeLeadStatus } from '@/actions/leads';
import { STATUSES, formatDuration, leadTypeLabel, sourceLabel } from '@/lib/constants';
import type { Lead } from '@prisma/client';
import type { SafeUser as User } from '@/lib/safeUser';

type LeadWithAssignee = Lead & { assignedTo: User | null };

const COLUMN_STYLES: Record<string, { header: string; dot: string }> = {
    NUEVO: { header: 'text-cyan-700 bg-cyan-50 border-cyan-200', dot: 'bg-cyan-500' },
    EN_ATENCION: { header: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    SEGUIMIENTO: { header: 'text-indigo-700 bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
    CERRADO: { header: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
    DESISTIDO: { header: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
};

export function KanbanBoard({ leads }: { leads: LeadWithAssignee[] }) {
    const [items, setItems] = useState(leads);
    const [dragId, setDragId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<string>('ALL');
    const [, startTransition] = useTransition();

    const columns = useMemo(() => {
        const byStatus = new Map<string, LeadWithAssignee[]>();
        for (const s of STATUSES) byStatus.set(s.value, []);
        for (const lead of items) {
            byStatus.get(lead.status)?.push(lead);
        }
        return byStatus;
    }, [items]);

    function moveToStatus(leadId: number, status: string) {
        let lostReason: string | null = null;
        if (status === 'DESISTIDO') {
            lostReason = window.prompt('Motivo del desistimiento:')?.trim() || null;
            if (!lostReason) return;
        }

        const before = items;
        setItems((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
        startTransition(async () => {
            const saved = await changeLeadStatus(leadId, status, lostReason).then((r) => r.ok).catch(() => false);
            if (!saved) setItems(before);
        });
    }

    function handleDrop(status: string) {
        if (dragId == null) return;
        const leadId = dragId;
        setDragId(null);
        moveToStatus(leadId, status);
    }

    const visibleStatuses = activeTab === 'ALL' ? STATUSES : STATUSES.filter((s) => s.value === activeTab);

    return (
        <div className="space-y-4">
            {/* Selector de pestañas para móviles y tablets */}
            <div className="xl:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    className={clsx(
                        'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                        activeTab === 'ALL'
                            ? 'bg-[#0B1E40] text-white border-[#0B1E40] shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                    )}
                >
                    Todas ({items.length})
                </button>
                {STATUSES.map((s) => {
                    const count = columns.get(s.value)?.length ?? 0;
                    const isSelected = activeTab === s.value;
                    const style = COLUMN_STYLES[s.value];
                    return (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => setActiveTab(s.value)}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                                isSelected
                                    ? 'bg-[#0B1E40] text-white border-[#0B1E40] shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                            )}
                        >
                            <span className={clsx('h-2 w-2 rounded-full', isSelected ? 'bg-cyan-400' : style.dot)} />
                            <span>{s.label}</span>
                            <span className={clsx('text-[10px] px-1.5 py-0.2 rounded-full', isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500')}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Columnas Kanban: en desktop grid de 5, en móvil flex snap swipeable o columna seleccionada */}
            <div
                className={clsx(
                    'xl:grid xl:grid-cols-5 xl:gap-4',
                    activeTab === 'ALL'
                        ? 'flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-4 -mx-3.5 px-3.5 sm:-mx-0 sm:px-0'
                        : 'grid grid-cols-1 gap-4',
                )}
            >
                {visibleStatuses.map((col) => {
                    const style = COLUMN_STYLES[col.value];
                    const leadsInColumn = columns.get(col.value) ?? [];
                    return (
                        <div
                            key={col.value}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(col.value)}
                            className={clsx(
                                'flex flex-col min-h-[420px]',
                                activeTab === 'ALL'
                                    ? 'min-w-[285px] sm:min-w-[320px] max-w-[340px] xl:max-w-none xl:min-w-0 snap-start flex-1 shrink-0'
                                    : 'w-full',
                            )}
                        >
                            <div className={clsx('flex items-center justify-between px-4 py-3 rounded-t-xl border font-bold text-sm', style.header)}>
                                <span className="flex items-center gap-2">
                                    <span className={clsx('h-2 w-2 rounded-full', style.dot)} />
                                    {col.label}
                                </span>
                                <span className="text-xs font-semibold bg-white/80 rounded-full px-2 py-0.5 shadow-xs">{leadsInColumn.length}</span>
                            </div>
                            <div className="flex-1 bg-slate-100/70 border border-t-0 border-slate-200 rounded-b-xl p-2.5 space-y-2.5">
                                {leadsInColumn.length === 0 && (
                                    <p className="text-xs text-slate-400 text-center py-10">Sin prospectos en esta etapa.</p>
                                )}
                                {leadsInColumn.map((lead) => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        onDragStart={() => setDragId(lead.id)}
                                        onMoveStatus={(newStatus) => moveToStatus(lead.id, newStatus)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LeadCard({
    lead,
    onDragStart,
    onMoveStatus,
}: {
    lead: LeadWithAssignee;
    onDragStart: () => void;
    onMoveStatus: (status: string) => void;
}) {
    const waitingSinceMs = Date.now() - new Date(lead.createdAt).getTime();
    const isStaleNew = lead.status === 'NUEVO' && waitingSinceMs > 1000 * 60 * 60 * 4; // 4h sin atender

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
            <Link
                href={`/leads/${lead.id}`}
                draggable
                onDragStart={onDragStart}
                className="block cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="font-bold text-slate-900 text-sm leading-tight truncate hover:text-amber-600 transition-colors">{lead.name.toUpperCase()}</p>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400 font-mono">{lead.code}</span>
                </div>

                {lead.company && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 truncate">
                        <Building2 size={12} className="shrink-0" /> {lead.company.toUpperCase()}
                    </p>
                )}
                {lead.comuna && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 truncate">
                        <MapPin size={12} className="shrink-0 text-slate-400" /> {lead.comuna}
                    </p>
                )}
                {lead.certificationInterest && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-600 mb-2 truncate">
                        <GraduationCap size={12} className="shrink-0 text-[#0B1E40]" /> {lead.certificationInterest}
                    </p>
                )}
            </Link>

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 truncate">
                    {leadTypeLabel(lead.type)} · {sourceLabel(lead.source)}
                </span>
                
                <div className="flex items-center gap-2 shrink-0">
                    {/* Selector rápido de etapa para móviles y pantallas táctiles */}
                    <div className="xl:hidden">
                        <select
                            value={lead.status}
                            onChange={(e) => onMoveStatus(e.target.value)}
                            aria-label="Mover etapa"
                            className="text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
                        >
                            {STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

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
            </div>

            {isStaleNew && (
                <p className="flex items-center gap-1 text-[11px] font-semibold text-red-600 mt-2">
                    <Clock size={11} /> Sin atender hace {formatDuration(waitingSinceMs)}
                </p>
            )}
        </div>
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
