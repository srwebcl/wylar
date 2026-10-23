'use client';

import { useEffect, useState, useTransition } from 'react';
import { AlertCircle, Ban, Check, Download, IdCard, Pencil, Plus, Settings, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { issueCertificate, revokeCertificate, updateCertificate, deleteCertificate } from '@/actions/certificates';
import { createCertificateCategory, createCertificationTitle } from '@/actions/certificateMeta';
import { CertificatesSearchBar } from '@/components/CertificatesSearchBar';
import { SearchableCreatableSelect } from '@/components/SearchableCreatableSelect';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { CertificateDiplomaPreview } from '@/components/CertificateDiplomaPreview';
import { isValidRut, formatRut } from '@/lib/rut';

interface CertificateRow {
    id: number;
    code: string;
    holderName: string;
    holderRut: string;
    certificationTitle: string;
    categoryLabel: string;
    completionText: string;
    detailText: string | null;
    issueDate: string;
    expiryDate: string | null;
    status: 'VIGENTE' | 'VENCIDO' | 'SIN_VENCIMIENTO' | 'REVOCADO';
    statusLabel: string;
    issuedByName: string | null;
}

interface CertificateTypeOption {
    id: number;
    label: string;
    completionText: string;
}

const STATUS_TONE: Record<CertificateRow['status'], string> = {
    VIGENTE: 'bg-emerald-50 text-emerald-700',
    VENCIDO: 'bg-red-50 text-red-700',
    SIN_VENCIMIENTO: 'bg-slate-100 text-slate-600',
    REVOCADO: 'bg-red-100 text-red-800',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function formatShortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function typeLabelFor(completionText: string, types: CertificateTypeOption[]): string {
    return types.find((t) => t.completionText === completionText)?.label ?? '—';
}

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

export interface CertificationTitleDetail {
    id: number;
    name: string;
    typeId?: number | null;
    typeCompletionText?: string | null;
    typeLabel?: string | null;
    categoryId?: number | null;
    categoryName?: string | null;
}

export interface CategoryItem {
    id: number;
    name: string;
}

export function CertificateManagement({
    certificates,
    isAdmin,
    total,
    certificationTitles,
    certificationTitleDetails,
    categories,
    categoryList,
    types,
}: {
    certificates: CertificateRow[];
    isAdmin: boolean;
    total: number;
    certificationTitles: string[];
    certificationTitleDetails?: CertificationTitleDetail[];
    categories: string[];
    categoryList?: CategoryItem[];
    types: CertificateTypeOption[];
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingCode, setEditingCode] = useState<string | null>(null);
    const [localCategories, setLocalCategories] = useState(categories);
    const [localCertificationTitles, setLocalCertificationTitles] = useState(certificationTitles);

    useEffect(() => {
        setLocalCategories(categories);
    }, [categories]);

    useEffect(() => {
        setLocalCertificationTitles(certificationTitles);
    }, [certificationTitles]);

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
    const [rutError, setRutError] = useState<string | null>(null);
    const [certificationTitle, setCertificationTitle] = useState('');
    const [categoryLabel, setCategoryLabel] = useState(localCategories[0] ?? '');
    const [issueDate, setIssueDate] = useState(todayIso());
    const [expiryMode, setExpiryMode] = useState<string>('indefinida');
    const [expiryDate, setExpiryDate] = useState('');
    const [detailTemplate, setDetailTemplate] = useState<string>('ninguna');
    const [detailText, setDetailText] = useState('');
    const [completionText, setCompletionText] = useState(types[0]?.completionText ?? 'Ha completado satisfactoriamente el curso de');

    const isRutValid = holderRut.trim().length >= 8 && isValidRut(holderRut);

    function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
        // Sanitiza la entrada: solo números, puntos, guion y K/k
        const raw = e.target.value.toUpperCase();
        const clean = raw.replace(/[^0-9K.\-]/g, '').slice(0, 12);
        setHolderRut(clean);
        if (rutError) setRutError(null);
    }

    function handleRutBlur() {
        const trimmed = holderRut.trim();
        if (!trimmed) {
            setRutError(null);
            return;
        }
        if (isValidRut(trimmed)) {
            setHolderRut(formatRut(trimmed));
            setRutError(null);
        } else {
            setRutError('RUT inválido. Revisa el número y el dígito verificador.');
        }
    }

    function handleDetailTemplateChange(value: string) {
        setDetailTemplate(value);
        const template = DETAIL_TEMPLATES.find((t) => t.value === value);
        if (template && template.value !== 'personalizada') setDetailText(template.text);
    }

    function handleCertificationTitleChange(val: string) {
        setCertificationTitle(val);
        const match = certificationTitleDetails?.find(
            (item) => item.name.trim().toLowerCase() === val.trim().toLowerCase(),
        );
        if (match) {
            if (match.categoryName) {
                setCategoryLabel(match.categoryName);
            }
            if (match.typeCompletionText) {
                setCompletionText(match.typeCompletionText);
            }
        }
    }

    async function handleCreateCategory(name: string) {
        const formData = new FormData();
        formData.set('name', name);
        const result = await createCertificateCategory({}, formData);
        if (result.error) {
            // Puede fallar porque ya existe (otro usuario la creó mientras tanto) — igual queda disponible para elegir.
            setLocalCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
            return;
        }
        setLocalCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
    }

    async function handleCreateCertificationTitle(name: string) {
        const formData = new FormData();
        formData.set('name', name);
        const foundType = types.find((t) => t.completionText === completionText);
        if (foundType) formData.set('typeId', String(foundType.id));
        const foundCat = categoryList?.find((c) => c.name === categoryLabel);
        if (foundCat) formData.set('categoryId', String(foundCat.id));

        // Si falla es porque ya existe (otro usuario la creó mientras tanto) — igual queda disponible para elegir.
        await createCertificationTitle({}, formData);
        setLocalCertificationTitles((prev) => (prev.includes(name) ? prev : [...prev, name]));
    }

    function resetForm() {
        setHolderName('');
        setHolderRut('');
        setRutError(null);
        setCertificationTitle('');
        setCategoryLabel(localCategories[0] ?? '');
        setIssueDate(todayIso());
        setExpiryMode('indefinida');
        setExpiryDate('');
        setDetailTemplate('ninguna');
        setDetailText('');
        setCompletionText(types[0]?.completionText ?? 'Ha completado satisfactoriamente el curso de');
        setEditingCode(null);
    }

    function openCreateForm() {
        setError(null);
        setSuccess(null);
        setRutError(null);
        setEditingId(null);
        setEditingCode(null);
        resetForm();
        setShowForm(true);
    }

    function openEditForm(c: CertificateRow) {
        setError(null);
        setSuccess(null);
        setRutError(null);
        setEditingId(c.id);
        setEditingCode(c.code);
        setHolderName(c.holderName);
        setHolderRut(c.holderRut);
        setCertificationTitle(c.certificationTitle);
        setCategoryLabel(c.categoryLabel);
        setIssueDate(c.issueDate.slice(0, 10));
        if (c.expiryDate) {
            setExpiryMode('personalizada');
            setExpiryDate(c.expiryDate.slice(0, 10));
        } else {
            setExpiryMode('indefinida');
            setExpiryDate('');
        }
        setDetailTemplate(c.detailText ? 'personalizada' : 'ninguna');
        setDetailText(c.detailText ?? '');
        setCompletionText(c.completionText);
        setShowForm(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const trimmedRut = holderRut.trim();
        if (!trimmedRut) {
            setRutError('Ingresa el RUT del titular.');
            setError('Debes ingresar el RUT del titular.');
            return;
        }

        if (!isValidRut(trimmedRut)) {
            setRutError('RUT inválido. Revisa el número y el dígito verificador.');
            setError('El RUT ingresado no es válido según el algoritmo oficial (módulo 11).');
            return;
        }
        const canonicalRut = formatRut(trimmedRut);
        setHolderRut(canonicalRut);
        setRutError(null);

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

            const payload = {
                holderName,
                holderRut: canonicalRut,
                profileId: null,
                certificationTitle,
                categoryLabel: categoryLabel.trim() || 'Certificación Wylar',
                issueDate: new Date(issueDate),
                expiryDate: computedExpiryDate,
                leadId: null,
                detailText: detailText.trim() || null,
                completionText: completionText.trim(),
            };

            const result = editingId != null ? await updateCertificate(editingId, payload) : await issueCertificate(payload);
            if (result.error) {
                setError(result.error);
                return;
            }
            setSuccess(result.success ?? (editingId != null ? 'Certificado actualizado.' : 'Certificado emitido.'));
            resetForm();
            setEditingId(null);
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

    function handleDelete(id: number, code: string) {
        if (!confirm(`¿Eliminar definitivamente el certificado ${code}? Esta acción no se puede deshacer: el certificado dejará de existir en el validador. Queda registrado en la auditoría.`)) return;
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await deleteCertificate(id);
            if (result.error) setError(result.error);
            else setSuccess(result.success ?? 'Certificado eliminado.');
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Certificados</h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Emisión y validación de certificados — se consultan desde wylar.cl/validador. {total} en total.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                    <Link
                        href="/certificados/configuracion"
                        title="Catálogo y Configuración de Certificados"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium px-3.5 py-2.5 rounded-xl transition-colors text-xs sm:text-sm shadow-xs"
                    >
                        <Settings size={15} /> Catálogo y Configuración
                    </Link>
                    <button
                        onClick={openCreateForm}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-4 sm:px-5 py-2.5 rounded-xl transition-colors shadow-xs text-xs sm:text-sm"
                    >
                        <Plus size={16} /> Emitir certificado
                    </button>
                </div>
            </div>

            <CertificatesSearchBar types={types} />

            {!showForm && error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            {!showForm && success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl">{success}</div>}

            <Modal
                open={showForm}
                onClose={() => setShowForm(false)}
                title={editingId != null ? 'Editar certificado' : 'Emitir certificado'}
                maxWidth="max-w-6xl"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Columna Izquierda: Formulario de datos */}
                    <div className="lg:col-span-5 space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
                            {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl">{success}</div>}

                            <div className="space-y-3.5">
                                <Field label="Nombre completo del titular">
                                    <input
                                        value={holderName}
                                        onChange={(e) => setHolderName(e.target.value)}
                                        placeholder="Ej. Juan Pérez González"
                                        className={inputClass}
                                        required
                                    />
                                </Field>

                                <Field label="RUT del titular">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={holderRut}
                                            onChange={handleRutChange}
                                            onBlur={handleRutBlur}
                                            placeholder="12.345.678-5"
                                            maxLength={12}
                                            required
                                            className={`w-full pl-9 pr-9 py-2.5 bg-slate-50 border rounded-lg text-sm font-mono transition-all outline-none text-slate-900 ${
                                                rutError
                                                    ? 'border-red-300 ring-2 ring-red-200/60 focus:border-red-500 focus:ring-red-200 focus:bg-white bg-red-50/10'
                                                    : isRutValid
                                                    ? 'border-emerald-300 ring-1 ring-emerald-200/50 bg-emerald-50/10 focus:border-emerald-500 focus:ring-emerald-200/60 focus:bg-white'
                                                    : 'border-slate-200 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white'
                                            }`}
                                        />
                                        <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                                            <IdCard size={17} />
                                        </div>
                                        {isRutValid && (
                                            <div className="absolute right-3 top-2.5 text-emerald-600 flex items-center" title="RUT válido">
                                                <Check size={16} />
                                            </div>
                                        )}
                                    </div>
                                    {rutError ? (
                                        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                                            <AlertCircle size={13} className="shrink-0" />
                                            <span>{rutError}</span>
                                        </p>
                                    ) : isRutValid ? (
                                        <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                                            <Check size={12} className="shrink-0 text-emerald-600" />
                                            <span>RUT válido (Módulo 11 verificado)</span>
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Formato: 12.345.678-5 (se valida con dígito verificador)
                                        </p>
                                    )}
                                </Field>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="Certificación">
                                        <SearchableCreatableSelect
                                            value={certificationTitle}
                                            onChange={handleCertificationTitleChange}
                                            options={localCertificationTitles}
                                            onCreate={handleCreateCertificationTitle}
                                            placeholder="Busca o crea…"
                                            createLabel="Crear"
                                        />
                                    </Field>

                                    <Field label="Categoría">
                                        <SearchableCreatableSelect
                                            value={categoryLabel}
                                            onChange={setCategoryLabel}
                                            options={localCategories}
                                            onCreate={handleCreateCategory}
                                            placeholder="Busca o crea…"
                                            createLabel="Crear"
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="Fecha de emisión">
                                        <input
                                            type="date"
                                            value={issueDate}
                                            onChange={(e) => setIssueDate(e.target.value)}
                                            className={inputClass}
                                            required
                                        />
                                    </Field>

                                    <Field label="Vigencia">
                                        <div className="flex flex-col gap-2">
                                            <Select
                                                value={expiryMode}
                                                onChange={setExpiryMode}
                                                options={[
                                                    { value: 'indefinida', label: 'Indefinida (sin vencimiento)' },
                                                    { value: '1', label: '1 año' },
                                                    { value: '2', label: '2 años' },
                                                    { value: '3', label: '3 años' },
                                                    { value: 'personalizada', label: 'Personalizada...' },
                                                ]}
                                            />
                                            {expiryMode === 'personalizada' && (
                                                <input
                                                    type="date"
                                                    value={expiryDate}
                                                    onChange={(e) => setExpiryDate(e.target.value)}
                                                    className={inputClass}
                                                    required
                                                />
                                            )}
                                        </div>
                                    </Field>
                                </div>

                                {/* Bloque destacado 1: Tipo de certificado */}
                                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                                            Tipo de certificado
                                        </label>
                                        <span className="text-[11px] text-amber-800 font-semibold">
                                            Frase previa en el diploma
                                        </span>
                                    </div>
                                    <Select
                                        value={completionText}
                                        onChange={setCompletionText}
                                        options={types.map((t) => ({
                                            value: t.completionText,
                                            label: `${t.label} («${t.completionText}…»)`,
                                        }))}
                                    />
                                    <p className="text-[11px] text-amber-800/80 leading-tight">
                                        Se imprime directamente antes del nombre de la certificación. Observa cómo cambia en el pre-formato a la derecha.
                                    </p>
                                </div>

                                {/* Bloque destacado 2: Texto bajo la certificación */}
                                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-500/20" />
                                            Texto bajo la certificación (opcional)
                                        </label>
                                        <span className="text-[11px] text-sky-800 font-semibold">
                                            Párrafo en el diploma
                                        </span>
                                    </div>
                                    <Select
                                        value={detailTemplate}
                                        onChange={handleDetailTemplateChange}
                                        options={DETAIL_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
                                    />
                                    {detailTemplate !== 'ninguna' && (
                                        <textarea
                                            value={detailText}
                                            onChange={(e) => setDetailText(e.target.value)}
                                            rows={3}
                                            placeholder="Describe duración, fechas, nota obtenida, vigencia, etc."
                                            className={`${inputClass} text-xs leading-relaxed`}
                                        />
                                    )}
                                    <p className="text-[11px] text-sky-800/80 leading-tight">
                                        {detailTemplate === 'ninguna'
                                            ? 'No se incluirá párrafo adicional bajo la certificación en el PDF.'
                                            : 'Puedes usar una plantilla predeterminada o redactar tu propio texto.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-3 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm text-sm"
                                >
                                    <ShieldCheck size={16} />
                                    {editingId != null ? (isPending ? 'Guardando…' : 'Guardar cambios') : isPending ? 'Emitiendo…' : 'Emitir certificado'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Columna Derecha: Pre-formato del diploma en vivo */}
                    <div className="lg:col-span-7 lg:sticky lg:top-0">
                        <CertificateDiplomaPreview
                            holderName={holderName}
                            holderRut={holderRut}
                            certificationTitle={certificationTitle}
                            categoryLabel={categoryLabel}
                            completionText={completionText}
                            detailText={detailText}
                            issueDate={issueDate}
                            expiryMode={expiryMode}
                            expiryDate={expiryDate}
                            code={editingCode ?? 'WYL-PREVIEW'}
                        />
                    </div>
                </div>
            </Modal>

            {certificates.length === 0 ? (
                <div className="glass-card p-10 text-center text-slate-400">Aún no se han emitido certificados.</div>
            ) : (
                <div className="space-y-4">
                    {/* Tarjetas móviles para pantallas táctiles (< lg) */}
                    <div className="lg:hidden space-y-3">
                        {certificates.map((c) => (
                            <div key={c.id} className="glass-card bg-white p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="font-extrabold text-[#0B1E40] text-base truncate">{c.holderName}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                            <span>RUT: {c.holderRut}</span>
                                            <span>·</span>
                                            <span className="font-mono text-slate-600 font-bold">{c.code}</span>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_TONE[c.status]}`}>
                                        {c.statusLabel}
                                    </span>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1">
                                    <p className="font-bold text-slate-800 leading-snug">{c.certificationTitle}</p>
                                    <div className="flex items-center gap-2 text-slate-500 text-[11px] flex-wrap">
                                        <span>Cat: <strong className="text-slate-700">{c.categoryLabel}</strong></span>
                                        <span>·</span>
                                        <span>Tipo: <strong className="text-slate-700">{typeLabelFor(c.completionText, types)}</strong></span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <div>
                                        <span>Emisión: <strong>{formatShortDate(c.issueDate)}</strong></span>
                                        <span className="mx-1.5">·</span>
                                        <span>Vigencia: <strong>{c.expiryDate ? formatShortDate(c.expiryDate) : 'Sin venc.'}</strong></span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                    <span className="text-slate-400 text-[11px]">Por: {c.issuedByName ?? '—'}</span>
                                    <div className="flex items-center gap-1">
                                        {c.status !== 'REVOCADO' && (
                                            <a
                                                href={`/api/public/certificates/${c.code}/pdf`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1 py-1 px-2.5 bg-cyan-50 text-cyan-700 font-semibold rounded-lg hover:bg-cyan-100 transition-colors"
                                                title="Descargar PDF"
                                            >
                                                <Download size={14} /> PDF
                                            </a>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => openEditForm(c)}
                                                disabled={isPending}
                                                className="p-1.5 text-slate-500 hover:text-amber-600 transition-colors rounded-md"
                                                title="Editar"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                        )}
                                        {isAdmin && c.status !== 'REVOCADO' && (
                                            <button
                                                onClick={() => handleRevoke(c.id, c.code)}
                                                disabled={isPending}
                                                className="p-1.5 text-slate-500 hover:text-red-600 transition-colors rounded-md"
                                                title="Revocar"
                                            >
                                                <Ban size={15} />
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDelete(c.id, c.code)}
                                                disabled={isPending}
                                                className="p-1.5 text-slate-500 hover:text-red-600 transition-colors rounded-md"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabla completa desktop (>= lg) */}
                    <div className="hidden lg:block glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                                        <th className="px-5 py-3">Titular</th>
                                        <th className="px-5 py-3">RUT</th>
                                        <th className="px-5 py-3">Certificación</th>
                                        <th className="px-5 py-3">Categoría</th>
                                        <th className="px-5 py-3">Tipo</th>
                                        <th className="px-5 py-3">Código</th>
                                        <th className="px-5 py-3">Emisión</th>
                                        <th className="px-5 py-3">Vigencia</th>
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
                                            <td className="px-5 py-3.5 text-slate-700 max-w-[220px] truncate">{c.certificationTitle}</td>
                                            <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[160px] truncate">{c.categoryLabel}</td>
                                            <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{typeLabelFor(c.completionText, types)}</td>
                                            <td className="px-5 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap">{c.code}</td>
                                            <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatShortDate(c.issueDate)}</td>
                                            <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{c.expiryDate ? formatShortDate(c.expiryDate) : 'Sin vencimiento'}</td>
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
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => openEditForm(c)}
                                                            disabled={isPending}
                                                            className="p-2 text-slate-400 hover:text-amber-600 transition-colors disabled:opacity-50"
                                                            title="Editar certificado"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(c.id, c.code)}
                                                            disabled={isPending}
                                                            className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                            title="Eliminar certificado"
                                                        >
                                                            <Trash2 size={16} />
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
                </div>
            )}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';
