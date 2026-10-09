'use client';

import { useEffect, useState, useTransition } from 'react';
import { Ban, Download, Plus, ShieldCheck, X } from 'lucide-react';
import { issueCertificate, revokeCertificate } from '@/actions/certificates';
import { CertificatesSearchBar } from '@/components/CertificatesSearchBar';

// Etiqueta interna fija: ya no se pide en el formulario (no aparece en el
// PDF del diploma desde el rediseño), pero el registro la sigue guardando
// como metadato para la tabla de administración.
const DEFAULT_CATEGORY_LABEL = 'Certificación Wylar';

interface CertificateRow {
    id: number;
    code: string;
    holderName: string;
    holderRut: string;
    certificationTitle: string;
    categoryLabel: string;
    issueDate: string;
    expiryDate: string | null;
    status: 'VIGENTE' | 'VENCIDO' | 'SIN_VENCIMIENTO' | 'REVOCADO';
    statusLabel: string;
    issuedByName: string | null;
}

const STATUS_TONE: Record<CertificateRow['status'], string> = {
    VIGENTE: 'bg-emerald-50 text-emerald-700',
    VENCIDO: 'bg-red-50 text-red-700',
    SIN_VENCIMIENTO: 'bg-slate-100 text-slate-600',
    REVOCADO: 'bg-red-100 text-red-800',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

// Plantillas predeterminadas para el párrafo que va bajo el nombre de la
// certificación en el PDF. Son solo un punto de partida: quedan en el
// textarea para editarlas (completar horas, fechas, nota, etc.) antes de
// guardar. "" = sin texto adicional (el PDF no muestra ese párrafo).
const DETAIL_TEMPLATES: { value: string; label: string; text: string }[] = [
    { value: 'ninguna', label: 'Sin texto adicional', text: '' },
    {
        value: 'curso-evaluado',
        label: 'Curso con evaluación (nota mínima)',
        text: 'Con una duración total de [X] horas, distribuidas en [X] horas teóricas y [X] horas prácticas, realizado los días [DD] y [DD] de [mes] de [aaaa]. El participante obtuvo un resultado final de [XX]%, superando la nota mínima exigida de [XX]%, por lo cual se certifica su aprobación. Este certificado tiene una vigencia de [X] años contados desde la fecha de emisión.',
    },
    {
        value: 'curso-participacion',
        label: 'Curso de participación (sin evaluación)',
        text: 'Con una duración total de [X] horas, realizado los días [DD] al [DD] de [mes] de [aaaa]. Este certificado acredita la participación y asistencia del titular a la totalidad de la capacitación.',
    },
    {
        value: 'chilevalora',
        label: 'Certificación de competencias ChileValora',
        text: 'Certificación otorgada en el marco del Sistema Nacional de Certificación de Competencias Laborales de ChileValora, conforme al Perfil Ocupacional evaluado, con resultado APTO.',
    },
    { value: 'personalizada', label: 'Personalizado...', text: '' },
];

export function CertificateManagement({ certificates, isAdmin, total }: { certificates: CertificateRow[]; isAdmin: boolean; total: number }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (!showForm) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setShowForm(false);
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showForm]);

    const [holderName, setHolderName] = useState('');
    const [holderRut, setHolderRut] = useState('');
    const [certificationTitle, setCertificationTitle] = useState('');
    const [issueDate, setIssueDate] = useState(todayIso());
    const [expiryMode, setExpiryMode] = useState<string>('indefinida');
    const [expiryDate, setExpiryDate] = useState('');
    const [detailTemplate, setDetailTemplate] = useState<string>('ninguna');
    const [detailText, setDetailText] = useState('');
    const [completionText, setCompletionText] = useState('Ha completado satisfactoriamente el curso de');

    const existingCategories = Array.from(new Set(certificates.map((c) => c.categoryLabel))).filter(Boolean);
    const [categoryMode, setCategoryMode] = useState<'select' | 'new'>('select');
    const [categorySelect, setCategorySelect] = useState<string>(existingCategories.includes(DEFAULT_CATEGORY_LABEL) ? DEFAULT_CATEGORY_LABEL : existingCategories[0] || DEFAULT_CATEGORY_LABEL);
    const [categoryCustom, setCategoryCustom] = useState('');

    function handleDetailTemplateChange(value: string) {
        setDetailTemplate(value);
        const template = DETAIL_TEMPLATES.find((t) => t.value === value);
        if (template && template.value !== 'personalizada') setDetailText(template.text);
    }

    function resetForm() {
        setHolderName('');
        setHolderRut('');
        setCertificationTitle('');
        setIssueDate(todayIso());
        setExpiryMode('indefinida');
        setExpiryDate('');
        setDetailTemplate('ninguna');
        setDetailText('');
        setCompletionText('Ha completado satisfactoriamente el curso de');
        setCategoryMode('select');
        setCategorySelect(existingCategories.includes(DEFAULT_CATEGORY_LABEL) ? DEFAULT_CATEGORY_LABEL : existingCategories[0] || DEFAULT_CATEGORY_LABEL);
        setCategoryCustom('');
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        startTransition(async () => {
            let computedExpiryDate = null;
            if (expiryMode === 'personalizada') {
                computedExpiryDate = expiryDate ? new Date(expiryDate) : null;
            } else if (expiryMode === '1') {
                computedExpiryDate = new Date(issueDate);
                computedExpiryDate.setFullYear(computedExpiryDate.getFullYear() + 1);
            } else if (expiryMode === '2') {
                computedExpiryDate = new Date(issueDate);
                computedExpiryDate.setFullYear(computedExpiryDate.getFullYear() + 2);
            } else if (expiryMode === '3') {
                computedExpiryDate = new Date(issueDate);
                computedExpiryDate.setFullYear(computedExpiryDate.getFullYear() + 3);
            }
            
            const result = await issueCertificate({
                holderName,
                holderRut,
                profileId: null,
                certificationTitle,
                categoryLabel: (categoryMode === 'new' ? categoryCustom : categorySelect).trim() || DEFAULT_CATEGORY_LABEL,
                issueDate: new Date(issueDate),
                expiryDate: computedExpiryDate,
                leadId: null,
                detailText: detailText.trim() || null,
                completionText: completionText.trim(),
            });
            if (result.error) {
                setError(result.error);
                return;
            }
            setSuccess(result.success ?? 'Certificado emitido.');
            resetForm();
            setShowForm(false);
        });
    }

    function handleRevoke(id: number, code: string) {
        if (!confirm(`¿Revocar el certificado ${code}? Dejará de ser válido en el validador y su PDF no podrá descargarse. Queda registrado quién lo revocó.`)) return;
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await revokeCertificate(id);
            if (result.error) setError(result.error);
            else setSuccess(result.success ?? 'Certificado revocado.');
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Certificados</h1>
                    <p className="text-slate-500 text-sm mt-1">Emisión y validación de certificados — se consultan desde wylar.cl/validador. {total} en total.</p>
                </div>
                <button
                    onClick={() => {
                        setError(null);
                        setSuccess(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
                >
                    <Plus size={18} /> Emitir certificado
                </button>
            </div>

            <CertificatesSearchBar />

            {!showForm && error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            {!showForm && success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl">{success}</div>}

            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
                    onClick={() => setShowForm(false)}
                >
                    <form
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-slate-900">Emitir certificado</h2>
                            <button type="button" onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
                                <X size={20} />
                            </button>
                        </div>

                        {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
                        {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl">{success}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Nombre completo del titular">
                        <input value={holderName} onChange={(e) => setHolderName(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="RUT del titular">
                        <input value={holderRut} onChange={(e) => setHolderRut(e.target.value)} placeholder="12.345.678-9" className={inputClass} required />
                    </Field>
                    <Field label="Nombre de la certificación">
                        <input value={certificationTitle} onChange={(e) => setCertificationTitle(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Categoría de Certificación">
                        <div className="flex flex-col gap-2">
                            <select
                                value={categoryMode === 'new' ? 'NEW' : categorySelect}
                                onChange={(e) => {
                                    if (e.target.value === 'NEW') {
                                        setCategoryMode('new');
                                    } else {
                                        setCategoryMode('select');
                                        setCategorySelect(e.target.value);
                                    }
                                }}
                                className={inputClass}
                            >
                                {existingCategories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                                {!existingCategories.includes(DEFAULT_CATEGORY_LABEL) && (
                                    <option value={DEFAULT_CATEGORY_LABEL}>{DEFAULT_CATEGORY_LABEL}</option>
                                )}
                                <option value="NEW">Otra (añadir nueva)...</option>
                            </select>
                            {categoryMode === 'new' && (
                                <input
                                    value={categoryCustom}
                                    onChange={(e) => setCategoryCustom(e.target.value)}
                                    placeholder="Nombre de la nueva categoría"
                                    className={inputClass}
                                    required
                                />
                            )}
                        </div>
                    </Field>
                    <Field label="Fecha de emisión">
                        <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Vigencia">
                        <div className="flex flex-col gap-2">
                            <select value={expiryMode} onChange={(e) => setExpiryMode(e.target.value)} className={inputClass}>
                                <option value="indefinida">Indefinida (Sin vencimiento)</option>
                                <option value="1">1 Año</option>
                                <option value="2">2 Años</option>
                                <option value="3">3 Años</option>
                                <option value="personalizada">Personalizada...</option>
                            </select>
                            {expiryMode === 'personalizada' && (
                                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={inputClass} required />
                            )}
                        </div>
                    </Field>
                    <Field label="Tipo de Certificado">
                        <select value={completionText} onChange={(e) => setCompletionText(e.target.value)} className={inputClass}>
                            <option value="Ha completado satisfactoriamente el curso de">CURSO</option>
                            <option value="Ha completado satisfactoriamente la Certificación de">CERTIFICACIÓN</option>
                            <option value="Ha completado satisfactoriamente la Calificación de">CALIFICACIÓN</option>
                            <option value="Ha completado satisfactoriamente la Inspección de">INSPECCIÓN</option>
                        </select>
                    </Field>
                </div>

                <Field label="Texto bajo la certificación (opcional, va en el PDF)">
                    <div className="flex flex-col gap-2">
                        <select value={detailTemplate} onChange={(e) => handleDetailTemplateChange(e.target.value)} className={inputClass}>
                            {DETAIL_TEMPLATES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                        {detailTemplate !== 'ninguna' && (
                            <textarea
                                value={detailText}
                                onChange={(e) => setDetailText(e.target.value)}
                                rows={4}
                                placeholder="Describe duración, fechas, nota obtenida, vigencia, etc."
                                className={inputClass}
                            />
                        )}
                    </div>
                </Field>

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
                </div>
            )}

            {certificates.length === 0 ? (
                <div className="glass-card p-10 text-center text-slate-400">Aún no se han emitido certificados.</div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    <th className="px-5 py-3">Titular</th>
                                    <th className="px-5 py-3">RUT</th>
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
                                        <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">{c.holderName}</td>
                                        <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">{c.holderRut}</td>
                                        <td className="px-5 py-3.5 text-slate-700 max-w-[260px] truncate">{c.certificationTitle}</td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap">{c.code}</td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_TONE[c.status]}`}>{c.statusLabel}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{c.issuedByName ?? '—'}</td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                {c.status !== 'REVOCADO' && (
                                                    <a
                                                        href={`/api/public/certificates/${c.code}/pdf`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-slate-400 hover:text-cyan-700 transition-colors"
                                                        title="Descargar PDF"
                                                    >
                                                        <Download size={16} />
                                                    </a>
                                                )}
                                                {isAdmin && c.status !== 'REVOCADO' && (
                                                    <button
                                                        onClick={() => handleRevoke(c.id, c.code)}
                                                        disabled={isPending}
                                                        className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                        title="Revocar certificado"
                                                    >
                                                        <Ban size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
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
