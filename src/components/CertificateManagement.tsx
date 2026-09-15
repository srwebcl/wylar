'use client';

import { useState, useTransition } from 'react';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { issueCertificate, revokeCertificate } from '@/actions/certificates';
import { suggestedCategoryLabel } from '@/lib/catalogSpec';

interface Profile {
    id: number;
    title: string;
    templateType: string;
}

interface ClosedLead {
    id: number;
    name: string;
    email: string;
    certificationInterest: string | null;
}

interface CertificateRow {
    id: number;
    code: string;
    holderName: string;
    holderRut: string;
    certificationTitle: string;
    categoryLabel: string;
    issueDate: string;
    expiryDate: string | null;
    status: 'VIGENTE' | 'VENCIDO' | 'SIN_VENCIMIENTO';
    statusLabel: string;
    issuedByName: string | null;
}

const STATUS_TONE: Record<CertificateRow['status'], string> = {
    VIGENTE: 'bg-emerald-50 text-emerald-700',
    VENCIDO: 'bg-red-50 text-red-700',
    SIN_VENCIMIENTO: 'bg-slate-100 text-slate-600',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export function CertificateManagement({ profiles, closedLeads, certificates }: { profiles: Profile[]; closedLeads: ClosedLead[]; certificates: CertificateRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [holderName, setHolderName] = useState('');
    const [holderRut, setHolderRut] = useState('');
    const [profileId, setProfileId] = useState<string>('');
    const [certificationTitle, setCertificationTitle] = useState('');
    const [categoryLabel, setCategoryLabel] = useState('');
    const [issueDate, setIssueDate] = useState(todayIso());
    const [expiryDate, setExpiryDate] = useState('');
    const [leadId, setLeadId] = useState<string>('');

    function handleProfileChange(value: string) {
        setProfileId(value);
        const profile = profiles.find((p) => String(p.id) === value);
        if (profile) {
            setCertificationTitle(profile.title);
            setCategoryLabel(suggestedCategoryLabel(profile.templateType));
        }
    }

    function handleLeadChange(value: string) {
        setLeadId(value);
        const lead = closedLeads.find((l) => String(l.id) === value);
        if (lead) {
            setHolderName(lead.name);
        }
    }

    function resetForm() {
        setHolderName('');
        setHolderRut('');
        setProfileId('');
        setCertificationTitle('');
        setCategoryLabel('');
        setIssueDate(todayIso());
        setExpiryDate('');
        setLeadId('');
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        startTransition(async () => {
            const result = await issueCertificate({
                holderName,
                holderRut,
                profileId: profileId ? Number(profileId) : null,
                certificationTitle,
                categoryLabel,
                issueDate: new Date(issueDate),
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                leadId: leadId ? Number(leadId) : null,
            });
            if (result.error) {
                setError(result.error);
                return;
            }
            setSuccess(result.success ?? 'Certificado emitido.');
            resetForm();
        });
    }

    function handleRevoke(id: number, code: string) {
        if (!confirm(`¿Eliminar el certificado ${code}? Dejará de ser válido en el validador.`)) return;
        startTransition(async () => {
            await revokeCertificate(id);
        });
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
                <h2 className="font-bold text-slate-900">Emitir certificado</h2>

                {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
                {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl">{success}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Lead cerrado (opcional)">
                        <select value={leadId} onChange={(e) => handleLeadChange(e.target.value)} className={inputClass}>
                            <option value="">— Sin vincular —</option>
                            {closedLeads.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name} ({l.email})
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Perfil del catálogo (opcional)">
                        <select value={profileId} onChange={(e) => handleProfileChange(e.target.value)} className={inputClass}>
                            <option value="">— Sin vincular —</option>
                            {profiles.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.title}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Nombre completo del titular">
                        <input value={holderName} onChange={(e) => setHolderName(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="RUT del titular">
                        <input value={holderRut} onChange={(e) => setHolderRut(e.target.value)} placeholder="12.345.678-9" className={inputClass} required />
                    </Field>
                    <Field label="Nombre de la certificación">
                        <input value={certificationTitle} onChange={(e) => setCertificationTitle(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Categoría (etiqueta del validador)">
                        <input value={categoryLabel} onChange={(e) => setCategoryLabel(e.target.value)} placeholder="Certificación ChileValora" className={inputClass} required />
                    </Field>
                    <Field label="Fecha de emisión">
                        <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Fecha de vencimiento (opcional)">
                        <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={inputClass} />
                    </Field>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                    >
                        <ShieldCheck size={16} /> {isPending ? 'Emitiendo…' : 'Emitir certificado'}
                    </button>
                </div>
            </form>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                            <th className="px-5 py-3">Titular</th>
                            <th className="px-5 py-3">Certificación</th>
                            <th className="px-5 py-3">Código</th>
                            <th className="px-5 py-3">Estado</th>
                            <th className="px-5 py-3">Emitido por</th>
                            <th className="px-5 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certificates.map((c) => (
                            <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-3.5">
                                    <p className="font-bold text-slate-900">{c.holderName}</p>
                                    <p className="text-xs text-slate-400">{c.holderRut}</p>
                                </td>
                                <td className="px-5 py-3.5">
                                    <p className="text-slate-700">{c.certificationTitle}</p>
                                    <p className="text-xs text-slate-400">{c.categoryLabel}</p>
                                </td>
                                <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{c.code}</td>
                                <td className="px-5 py-3.5">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_TONE[c.status]}`}>{c.statusLabel}</span>
                                </td>
                                <td className="px-5 py-3.5 text-slate-500">{c.issuedByName ?? '—'}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center justify-end gap-1">
                                        <a
                                            href={`/api/public/certificates/${c.code}/pdf`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 text-slate-400 hover:text-cyan-700 transition-colors"
                                            title="Descargar PDF"
                                        >
                                            <Download size={16} />
                                        </a>
                                        <button
                                            onClick={() => handleRevoke(c.id, c.code)}
                                            disabled={isPending}
                                            className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {certificates.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                                    Aún no se han emitido certificados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';
