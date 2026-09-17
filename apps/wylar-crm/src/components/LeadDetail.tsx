'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { Send, User as UserIcon, Calendar, Phone, Mail, Building2, GraduationCap, Tag, Clock, TimerReset, AlarmClock } from 'lucide-react';
import clsx from 'clsx';
import type { Lead, LeadActivity, User } from '@prisma/client';
import { addLeadActivity, assignLead, changeLeadStatusForm, type LeadFormState } from '@/actions/leads';
import { ACTIVITY_TYPES, STATUSES, SOURCES, leadTypeLabel, sourceLabel, activityTypeLabel, formatDuration } from '@/lib/constants';

type LeadWithRelations = Lead & { assignedTo: User | null; activities: LeadActivity[] };

function statusStyle(s: string) {
    switch (s) {
        case 'NUEVO': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
        case 'EN_ATENCION': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'SEGUIMIENTO': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case 'CERRADO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

const initialState: LeadFormState = {};

export function LeadDetail({ lead, users }: { lead: LeadWithRelations; users: User[] }) {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const noteFormRef = useRef<HTMLFormElement>(null);

    const [pendingStatus, setPendingStatus] = useState(lead.status);
    const [activityState, activityAction, activityPending] = useActionState(addLeadActivity.bind(null, lead.id), initialState);
    const [statusState, statusAction, statusPending] = useActionState(changeLeadStatusForm.bind(null, lead.id), initialState);
    const [, startAssignTransition] = useTransition();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lead.activities.length]);

    useEffect(() => {
        if (activityState.success) noteFormRef.current?.reset();
    }, [activityState.success]);

    const responseMs = lead.firstAttendedAt ? lead.firstAttendedAt.getTime() - lead.createdAt.getTime() : null;
    const waitingMs = lead.firstAttendedAt ? null : Date.now() - lead.createdAt.getTime();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center flex-wrap gap-3">
                        <h2 className="text-2xl font-extrabold text-slate-800">{lead.code}</h2>
                        <span className={clsx('px-3 py-1 rounded-full text-xs font-bold border shadow-sm', statusStyle(lead.status))}>
                            {STATUSES.find((s) => s.value === lead.status)?.label}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-50 text-slate-500 border-slate-200">
                            {leadTypeLabel(lead.type)} · {sourceLabel(lead.source)}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 flex items-center">
                        <Calendar size={14} className="mr-1.5" /> Ingresó el {new Date(lead.createdAt).toLocaleString('es-CL')}
                    </p>
                </div>

                <form action={statusAction} className="flex flex-col items-end gap-2 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center space-x-3">
                        <label className="text-sm font-bold text-slate-700">Estado:</label>
                        <select
                            name="status"
                            value={pendingStatus}
                            onChange={(e) => setPendingStatus(e.target.value)}
                            className="bg-slate-50 border-slate-200 rounded-lg text-sm font-semibold p-2 focus:ring-2 focus:ring-[#0B1E40] outline-none cursor-pointer"
                        >
                            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <button type="submit" disabled={statusPending} className="px-3 py-2 bg-[#0B1E40] text-white text-sm font-bold rounded-lg hover:bg-[#122b59] disabled:opacity-60 transition-colors">
                            Guardar
                        </button>
                    </div>
                    {statusState.error && <p className="text-xs text-red-600 font-medium">{statusState.error}</p>}
                </form>
            </div>

            {/* Auditoría de Tiempos de Respuesta */}
            <div className={clsx('rounded-xl border p-4 flex items-center gap-3', responseMs != null ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')}>
                {responseMs != null ? <TimerReset size={20} className="text-emerald-600 shrink-0" /> : <AlarmClock size={20} className="text-red-600 shrink-0" />}
                <p className="text-sm font-semibold text-slate-700">
                    {responseMs != null ? (
                        <>Primera atención registrada <span className="font-extrabold text-emerald-700">{formatDuration(responseMs)}</span> después del ingreso ({new Date(lead.firstAttendedAt!).toLocaleString('es-CL')}).</>
                    ) : (
                        <>Aún sin atender — lleva <span className="font-extrabold text-red-700">{formatDuration(waitingMs!)}</span> esperando primera gestión.</>
                    )}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <div className="glass-card overflow-hidden">
                        <div className="bg-gradient-to-r from-[#0B1E40] to-[#122b59] p-4">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <UserIcon size={18} className="mr-2 text-amber-400" /> Ficha del prospecto
                            </h3>
                        </div>
                        <div className="p-5 space-y-4 bg-white">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre completo</p>
                                <p className="font-bold text-slate-800 text-lg">{lead.name}</p>
                            </div>
                            {lead.company && (
                                <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    <Building2 size={16} className="text-slate-400 mr-3 shrink-0" />
                                    <span className="text-sm text-slate-700 font-medium">{lead.company}</span>
                                </div>
                            )}
                            <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <Mail size={16} className="text-slate-400 mr-3 shrink-0" />
                                <a href={`mailto:${lead.email}`} className="text-sm text-slate-700 font-medium hover:underline">{lead.email}</a>
                            </div>
                            <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <Phone size={16} className="text-slate-400 mr-3 shrink-0" />
                                <a href={`tel:${lead.phone}`} className="text-sm text-slate-700 font-medium hover:underline">{lead.phone}</a>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                                <Tag size={16} className="mr-2 text-[#0B1E40]" /> Detalles de la oportunidad
                            </h3>
                        </div>
                        <div className="p-5 space-y-4 bg-white">
                            <div className="flex items-start">
                                <GraduationCap size={16} className="text-slate-400 mr-3 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Certificación de interés</p>
                                    <p className="font-bold text-slate-800">{lead.certificationInterest || 'No especificada'}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Origen (rastreo)</p>
                                <p className="font-bold text-slate-800">{SOURCES.find((s) => s.value === lead.source)?.label ?? lead.source}</p>
                                {lead.sourceDetail && <p className="text-xs text-slate-500 mt-0.5 break-all">{lead.sourceDetail}</p>}
                            </div>

                            <div className="pt-4 border-t border-slate-100 mt-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Responsable actual</p>
                                <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-[#0B1E40] text-white flex items-center justify-center text-[10px] font-bold mr-2 shrink-0">
                                        {lead.assignedTo ? lead.assignedTo.name.charAt(0) : '—'}
                                    </div>
                                    <p className="font-bold text-slate-700">{lead.assignedTo?.name ?? 'Sin asignar'}</p>
                                </div>
                                <form action={(formData) => startAssignTransition(() => assignLead(lead.id, formData))} className="flex items-center gap-2 mt-2">
                                    <select name="assignedToId" defaultValue={lead.assignedToId ?? ''} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none">
                                        <option value="">Sin asignar</option>
                                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                    <button type="submit" className="px-2.5 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors shrink-0">
                                        Asignar
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 glass-card flex flex-col h-[750px] overflow-hidden">
                    {lead.message && (
                        <div className="p-6 border-b border-slate-100 bg-white">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Mensaje original del formulario</h3>
                            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#0B1E40] rounded-l-xl"></div>
                                <p className="text-slate-700 leading-relaxed font-medium italic text-[15px]">&ldquo;{lead.message}&rdquo;</p>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center relative">
                            <span className="bg-slate-50/50 px-3 relative z-10">Bitácora de gestiones</span>
                            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -z-0"></div>
                        </h4>

                        <div className="space-y-0 pl-2 mt-4 pb-10">
                            {lead.activities.map((a, i) => {
                                const isSystem = a.userId === null;
                                const isLast = i === lead.activities.length - 1;

                                return (
                                    <div key={a.id} className="relative pl-8 pb-6 group">
                                        {!isLast && <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-slate-200"></div>}
                                        <div className={clsx('absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm z-10', isSystem ? 'bg-slate-400' : 'bg-amber-500')}></div>

                                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 border-b border-slate-100 pb-3 gap-2">
                                                <div>
                                                    <span className="font-extrabold text-slate-800 text-base">{a.authorName}</span>
                                                    <span className="ml-3 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                                                        {activityTypeLabel(a.type)}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-semibold text-slate-500 flex items-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                    <Clock size={14} className="mr-1.5 text-slate-400" />
                                                    {new Date(a.createdAt).toLocaleString('es-CL', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 text-[15px] whitespace-pre-wrap leading-relaxed font-medium">{a.text}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    <form ref={noteFormRef} action={activityAction} className="p-4 bg-white border-t border-slate-100 space-y-2">
                        <div className="flex items-end space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-[#0B1E40] focus-within:ring-2 focus-within:ring-[#0B1E40]/20 transition-all">
                            <select name="type" defaultValue="NOTA" className="bg-transparent text-sm font-semibold text-slate-600 outline-none shrink-0">
                                {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>

                            <textarea
                                name="text"
                                required
                                placeholder="Escribe una nota, resumen de llamada o de la conversación por WhatsApp..."
                                className="flex-1 bg-transparent border-none p-2 focus:ring-0 outline-none resize-none max-h-32 min-h-[44px] text-sm text-slate-700"
                                rows={1}
                            ></textarea>
                            <button type="submit" disabled={activityPending} className="bg-[#0B1E40] disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl hover:bg-[#122b59] transition-colors shadow-md shrink-0">
                                <Send size={18} />
                            </button>
                        </div>
                        {activityState.error && <p className="text-xs text-red-600 font-medium text-center">{activityState.error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}
