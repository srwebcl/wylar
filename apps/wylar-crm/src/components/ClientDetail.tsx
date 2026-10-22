'use client';

import { useActionState, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Pencil,
    Mail,
    Phone,
    IdCard,
    Building2,
    Plus,
    Trash2,
    User as UserIcon,
    Clock,
    BellRing,
    CheckCircle2,
    X,
    Loader2,
    ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';
import {
    updateClient,
    createClientContact,
    deleteClientContact,
    applyClientContactDiscrepancy,
    type ClientFormState,
} from '@/actions/clients';
import { leadTypeLabel, statusLabel } from '@/lib/constants';
import { isValidRut, formatRut } from '@/lib/rut';
import { isValidChileanMobile, formatChileanMobile } from '@/lib/phone';
import type { Client, ClientContact, Lead, LeadActivity } from '@prisma/client';

type OpportunityRow = Lead & { product: { name: string } | null };
type ActivityRow = LeadActivity & { lead: { id: number; code: string } };

interface DiscrepancyItem {
    leadId: number;
    leadCode: string;
    date: Date;
    newEmail?: string;
    newPhone?: string;
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-sm text-slate-900';

const STATUS_BADGE: Record<string, string> = {
    NUEVO: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    EN_ATENCION: 'bg-amber-50 text-amber-700 border-amber-200',
    SEGUIMIENTO: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    CERRADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DESISTIDO: 'bg-rose-50 text-rose-700 border-rose-200',
};

const initialState: ClientFormState = {};

export function ClientDetail({
    client,
    contacts,
    opportunities,
    activities,
}: {
    client: Client;
    contacts: ClientContact[];
    opportunities: OpportunityRow[];
    activities: ActivityRow[];
}) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [fields, setFields] = useState({
        name: client.name,
        rut: client.rut ?? '',
        email: client.email,
        phone: client.phone,
        company: client.company ?? '',
    });
    const [fieldErrors, setFieldErrors] = useState<{ rut?: string; phone?: string }>({});
    const [state, formAction, pending] = useActionState(updateClient.bind(null, client.id), initialState);

    // Estado para discrepancias de contacto detectadas
    const [dismissedLeadIds, setDismissedLeadIds] = useState<number[]>([]);
    const [resolvingLeadId, setResolvingLeadId] = useState<number | null>(null);
    const [discrepancyNotice, setDiscrepancyNotice] = useState<{ text: string; error?: boolean } | null>(null);

    // Detectar si alguna oportunidad tiene correo o teléfono diferente
    const discrepancies: DiscrepancyItem[] = useMemo(() => {
        const list: DiscrepancyItem[] = [];
        const clientEmailNorm = client.email.trim().toLowerCase();
        const clientPhoneNorm = (formatChileanMobile(client.phone) ?? client.phone).trim();
        const contactEmails = new Set(contacts.map((c) => c.email?.trim().toLowerCase()).filter(Boolean));
        const contactPhones = new Set(
            contacts.map((c) => (c.phone ? (formatChileanMobile(c.phone) ?? c.phone).trim() : null)).filter(Boolean),
        );

        for (const opp of opportunities) {
            if (dismissedLeadIds.includes(opp.id)) continue;

            const oppEmail = opp.email?.trim().toLowerCase();
            const oppPhone = (formatChileanMobile(opp.phone) ?? opp.phone)?.trim();

            const emailDiff = oppEmail && oppEmail !== clientEmailNorm && !contactEmails.has(oppEmail);
            const phoneDiff = oppPhone && oppPhone !== clientPhoneNorm && !contactPhones.has(oppPhone);

            if (emailDiff || phoneDiff) {
                list.push({
                    leadId: opp.id,
                    leadCode: opp.code,
                    date: opp.createdAt,
                    newEmail: emailDiff ? oppEmail : undefined,
                    newPhone: phoneDiff ? oppPhone : undefined,
                });
            }
        }
        return list;
    }, [client, contacts, opportunities, dismissedLeadIds]);

    async function handleResolveDiscrepancy(disc: DiscrepancyItem, action: 'UPDATE_PRIMARY' | 'ADD_SECONDARY') {
        setResolvingLeadId(disc.leadId);
        setDiscrepancyNotice(null);
        try {
            const res = await applyClientContactDiscrepancy(client.id, {
                action,
                newEmail: disc.newEmail,
                newPhone: disc.newPhone,
                leadCode: disc.leadCode,
            });

            if (res.ok) {
                setDiscrepancyNotice({ text: res.success || 'Datos procesados con éxito.' });
                setDismissedLeadIds((prev) => [...prev, disc.leadId]);
                router.refresh();
            } else {
                setDiscrepancyNotice({ text: res.error || 'Error al procesar.', error: true });
            }
        } catch (e) {
            setDiscrepancyNotice({ text: 'Error inesperado al aplicar cambio.', error: true });
        } finally {
            setResolvingLeadId(null);
        }
    }

    function dismissDiscrepancy(leadId: number) {
        setDismissedLeadIds((prev) => [...prev, leadId]);
    }

    useEffect(() => {
        if (state.success) setEditing(false);
    }, [state.success]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const rutOk = isValidRut(fields.rut);
        const phoneCanonical = isValidChileanMobile(fields.phone) ? fields.phone : formatChileanMobile(fields.phone);
        const errors: { rut?: string; phone?: string } = {};
        if (!rutOk) errors.rut = 'RUT inválido.';
        if (!phoneCanonical) errors.phone = 'Teléfono inválido. Ej: +56 9 1234 5678.';
        setFieldErrors(errors);
        if (errors.rut || errors.phone) return;

        const fd = new FormData(e.currentTarget);
        fd.set('name', fields.name.trim().toUpperCase());
        fd.set('rut', formatRut(fields.rut));
        fd.set('email', fields.email.trim().toLowerCase());
        fd.set('phone', phoneCanonical!);
        if (fields.company) fd.set('company', fields.company.trim().toUpperCase());
        formAction(fd);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-slate-900">{client.name.toUpperCase()}</h1>
                        <span className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-50 text-slate-500 border-slate-200">
                            {leadTypeLabel(client.type)}
                        </span>
                    </div>
                    {client.company && <p className="text-slate-500 text-sm mt-1">{client.company.toUpperCase()}</p>}
                </div>
                <button
                    onClick={() => setEditing((v) => !v)}
                    className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                    <Pencil size={16} /> {editing ? 'Cancelar' : 'Editar'}
                </button>
            </div>

            {/* Aviso de Discrepancia de Contacto Detectada */}
            {discrepancies.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                            <BellRing size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-amber-950">
                                    Discrepancia en datos de contacto detectada
                                </h3>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                                    {discrepancies.length} {discrepancies.length === 1 ? 'oportunidad' : 'oportunidades'}
                                </span>
                            </div>
                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                Este cliente cotizó o ingresó un correo o teléfono diferente en una de sus oportunidades. Puedes actualizar los datos principales de la ficha o guardarlos como contacto secundario para mantener ambos.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-amber-200/70">
                        {discrepancies.map((disc) => (
                            <div
                                key={disc.leadId}
                                className="bg-white rounded-xl p-3.5 border border-amber-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/leads/${disc.leadId}`}
                                            className="font-mono font-bold text-[#0B1E40] hover:underline flex items-center gap-1"
                                        >
                                            {disc.leadCode} <ExternalLink size={12} />
                                        </Link>
                                        <span className="text-slate-400">
                                            ({new Date(disc.date).toLocaleDateString('es-CL')})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700 flex-wrap">
                                        {disc.newEmail && (
                                            <span>
                                                Nuevo correo: <strong className="text-slate-900">{disc.newEmail}</strong>{' '}
                                                <span className="text-slate-400">(Ficha: {client.email})</span>
                                            </span>
                                        )}
                                        {disc.newPhone && (
                                            <span>
                                                Nuevo teléfono:{' '}
                                                <strong className="text-slate-900">{disc.newPhone}</strong>{' '}
                                                <span className="text-slate-400">(Ficha: {client.phone})</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => handleResolveDiscrepancy(disc, 'UPDATE_PRIMARY')}
                                        disabled={resolvingLeadId === disc.leadId}
                                        className="px-3 py-1.5 bg-[#0B1E40] hover:bg-[#122b59] text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5"
                                    >
                                        {resolvingLeadId === disc.leadId ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : null}
                                        Actualizar ficha principal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleResolveDiscrepancy(disc, 'ADD_SECONDARY')}
                                        disabled={resolvingLeadId === disc.leadId}
                                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5"
                                    >
                                        Guardar como contacto secundario
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => dismissDiscrepancy(disc.leadId)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                                        title="Descartar aviso"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {discrepancyNotice && (
                <div
                    className={clsx(
                        'p-3 rounded-xl border text-xs font-semibold flex items-center gap-2',
                        discrepancyNotice.error
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700',
                    )}
                >
                    <CheckCircle2 size={16} /> {discrepancyNotice.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <div className="glass-card p-5 space-y-4">
                        {editing ? (
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                        Nombre
                                    </span>
                                    <input
                                        name="name"
                                        value={fields.name}
                                        onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
                                        className={inputClass}
                                        required
                                    />
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                        RUT
                                    </span>
                                    <input
                                        name="rut"
                                        value={fields.rut}
                                        onChange={(e) => setFields((f) => ({ ...f, rut: e.target.value }))}
                                        className={inputClass}
                                        required
                                    />
                                    {fieldErrors.rut && <p className="text-xs text-red-600 mt-1">{fieldErrors.rut}</p>}
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                        Correo
                                    </span>
                                    <input
                                        name="email"
                                        type="email"
                                        value={fields.email}
                                        onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
                                        className={inputClass}
                                        required
                                    />
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                        Teléfono
                                    </span>
                                    <input
                                        name="phone"
                                        value={fields.phone}
                                        onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))}
                                        className={inputClass}
                                        required
                                    />
                                    {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                        Empresa / institución
                                    </span>
                                    <input
                                        name="company"
                                        value={fields.company}
                                        onChange={(e) => setFields((f) => ({ ...f, company: e.target.value }))}
                                        className={inputClass}
                                    />
                                </label>
                                {state.error && <p className="text-xs text-red-600 font-medium">{state.error}</p>}
                                <button
                                    type="submit"
                                    disabled={pending}
                                    className="w-full bg-[#0B1E40] text-white font-bold py-2.5 rounded-lg hover:bg-[#122b59] disabled:opacity-60 cursor-pointer"
                                >
                                    {pending ? 'Guardando…' : 'Guardar cambios'}
                                </button>
                            </form>
                        ) : (
                            <>
                                {client.rut && (
                                    <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <IdCard size={16} className="text-slate-400 mr-3 shrink-0" />
                                        <span className="text-sm text-slate-700 font-medium">{client.rut}</span>
                                    </div>
                                )}
                                <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    <Mail size={16} className="text-slate-400 mr-3 shrink-0" />
                                    <a
                                        href={`mailto:${client.email.toLowerCase()}`}
                                        className="text-sm text-slate-700 font-medium hover:underline"
                                    >
                                        {client.email.toLowerCase()}
                                    </a>
                                </div>
                                <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    <Phone size={16} className="text-slate-400 mr-3 shrink-0" />
                                    <a
                                        href={`tel:${formatChileanMobile(client.phone) ?? client.phone}`}
                                        className="text-sm text-slate-700 font-medium hover:underline"
                                    >
                                        {formatChileanMobile(client.phone) ?? client.phone}
                                    </a>
                                </div>
                                {client.company && (
                                    <div className="flex items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <Building2 size={16} className="text-slate-400 mr-3 shrink-0" />
                                        <span className="text-sm text-slate-700 font-medium">
                                            {client.company.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <ClientContactsPanel clientId={client.id} contacts={contacts} />

                    <div className="glass-card overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                Oportunidades ({opportunities.length})
                            </h3>
                        </div>
                        <ul className="divide-y divide-slate-100">
                            {opportunities.map((o) => (
                                <li key={o.id} className="p-4">
                                    <Link href={`/leads/${o.id}`} className="font-bold text-[#0B1E40] hover:underline text-sm">
                                        {o.code}
                                    </Link>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {o.product?.name ?? o.certificationInterest ?? 'Sin producto'}
                                    </p>
                                    <span
                                        className={clsx(
                                            'inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full border',
                                            STATUS_BADGE[o.status],
                                        )}
                                    >
                                        {statusLabel(o.status)}
                                    </span>
                                </li>
                            ))}
                            {opportunities.length === 0 && (
                                <li className="p-4 text-sm text-slate-400 text-center">Sin oportunidades.</li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-2 glass-card overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                            <Clock size={16} className="mr-2 text-[#0B1E40]" /> Bitácora unificada ({activities.length})
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Gestiones de todas sus oportunidades, en orden cronológico.
                        </p>
                    </div>
                    <div className="p-5 space-y-4 max-h-[700px] overflow-y-auto">
                        {activities.map((a) => (
                            <div key={a.id} className="border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">{a.authorName}</span>
                                        <Link
                                            href={`/leads/${a.lead.id}`}
                                            className="text-xs font-bold text-[#0B1E40] bg-slate-100 px-2 py-0.5 rounded-md hover:underline"
                                        >
                                            {a.lead.code}
                                        </Link>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {new Date(a.createdAt).toLocaleString('es-CL')}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{a.text}</p>
                            </div>
                        ))}
                        {activities.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-10">Sin gestiones registradas todavía.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClientContactsPanel({ clientId, contacts }: { clientId: number; contacts: ClientContact[] }) {
    const [showForm, setShowForm] = useState(false);
    const createInitial: ClientFormState = {};
    const [state, formAction, pending] = useActionState(createClientContact.bind(null, clientId), createInitial);

    useEffect(() => {
        if (state.success) setShowForm(false);
    }, [state.success]);

    async function handleDelete(id: number) {
        if (!confirm('¿Eliminar este contacto?')) return;
        await deleteClientContact(id);
    }

    return (
        <div className="glass-card overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                    <UserIcon size={16} className="mr-2 text-[#0B1E40]" /> Contactos comerciales
                </h3>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="text-xs font-bold text-[#0B1E40] hover:underline flex items-center gap-1 cursor-pointer"
                >
                    <Plus size={14} /> Agregar
                </button>
            </div>
            <div className="p-4 space-y-3">
                {showForm && (
                    <form action={formAction} className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                        <input name="name" placeholder="Nombre" className={inputClass} required />
                        <input name="role" placeholder="Cargo (opcional)" className={inputClass} />
                        <input name="email" type="email" placeholder="Correo (opcional)" className={inputClass} />
                        <input name="phone" placeholder="Teléfono (opcional)" className={inputClass} />
                        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
                        <button
                            type="submit"
                            disabled={pending}
                            className="w-full bg-[#0B1E40] text-white text-xs font-bold py-2 rounded-lg disabled:opacity-60 cursor-pointer"
                        >
                            {pending ? 'Guardando…' : 'Guardar contacto'}
                        </button>
                    </form>
                )}
                {contacts.map((c) => {
                    const formattedEmail = c.email ? c.email.toLowerCase() : null;
                    const formattedPhone = c.phone ? (formatChileanMobile(c.phone) ?? c.phone) : null;
                    return (
                        <div
                            key={c.id}
                            className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                        >
                            <div>
                                <p className="text-sm font-bold text-slate-800">{c.name.toUpperCase()}</p>
                                <p className="text-xs text-slate-500">
                                    {[c.role, formattedEmail, formattedPhone].filter(Boolean).join(' · ') || '—'}
                                </p>
                            </div>
                            <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-600 shrink-0 cursor-pointer">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    );
                })}
                {contacts.length === 0 && !showForm && (
                    <p className="text-xs text-slate-400 text-center py-2">Sin contactos adicionales.</p>
                )}
            </div>
        </div>
    );
}
