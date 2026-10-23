'use client';

import { useMemo } from 'react';
import { Award, CheckCircle2, QrCode } from 'lucide-react';

interface CertificateDiplomaPreviewProps {
    holderName: string;
    holderRut: string;
    certificationTitle: string;
    categoryLabel: string;
    completionText: string;
    detailText: string;
    issueDate: string;
    expiryMode: string;
    expiryDate: string;
    code?: string;
}

function formatIssueDate(iso: string): string {
    if (!iso) return '—';
    try {
        const [y, m, d] = iso.split('-').map(Number);
        if (!y || !m || !d) return iso;
        const date = new Date(Date.UTC(y, m - 1, d));
        return date.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        });
    } catch {
        return iso;
    }
}

function computeVigenciaLabel(issueDate: string, expiryMode: string, expiryDate: string): string | null {
    if (expiryMode === 'indefinida') return null;
    if (expiryMode === 'personalizada') {
        if (!expiryDate) return null;
        try {
            const [y, m, d] = expiryDate.split('-').map(Number);
            const date = new Date(Date.UTC(y, m - 1, d));
            const label = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
            return label.charAt(0).toUpperCase() + label.slice(1);
        } catch {
            return expiryDate;
        }
    }

    const years = Number.parseInt(expiryMode, 10);
    if (!Number.isNaN(years) && issueDate) {
        try {
            const [y, m, d] = issueDate.split('-').map(Number);
            const date = new Date(Date.UTC(y + years, m - 1, d));
            const label = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
            return label.charAt(0).toUpperCase() + label.slice(1);
        } catch {
            return null;
        }
    }
    return null;
}

export function CertificateDiplomaPreview({
    holderName,
    holderRut,
    certificationTitle,
    categoryLabel,
    completionText,
    detailText,
    issueDate,
    expiryMode,
    expiryDate,
    code = 'WYL-PREVIEW',
}: CertificateDiplomaPreviewProps) {
    const formattedIssueDate = useMemo(() => formatIssueDate(issueDate), [issueDate]);
    const vigenciaLabel = useMemo(
        () => computeVigenciaLabel(issueDate, expiryMode, expiryDate),
        [issueDate, expiryMode, expiryDate],
    );

    const displayName = holderName.trim() ? holderName.toUpperCase() : 'NOMBRE COMPLETO DEL TITULAR';
    const displayRut = holderRut.trim() ? holderRut : 'XX.XXX.XXX-X';
    const displayTitle = certificationTitle.trim() || 'Nombre de la certificación';
    const displayLeadIn = completionText.trim() || 'Ha completado satisfactoriamente el curso de';

    return (
        <div className="space-y-3">
            {/* Cabecera explicativa */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                        <Award size={18} />
                    </span>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            Vista previa en vivo del Diploma (PDF)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Pre-formato exacto con los textos y formato del certificado emitido
                        </p>
                    </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Actualización en vivo
                </div>
            </div>

            {/* Guía rápida de campos destacados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-950 flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div>
                        <span className="font-bold text-amber-900 block">Tipo de certificado (Frase previa)</span>
                        <p className="text-amber-800/90 text-[11px] leading-snug">
                            Se inserta justo antes del nombre de la certificación.
                        </p>
                    </div>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200/70 text-sky-950 flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0" />
                    <div>
                        <span className="font-bold text-sky-900 block">Texto bajo la certificación (Detalle)</span>
                        <p className="text-sky-800/90 text-[11px] leading-snug">
                            Párrafo de horas, nota mínima, evaluación o marco regulatorio.
                        </p>
                    </div>
                </div>
            </div>

            {/* Marco del Diploma */}
            <div className="bg-gradient-to-br from-[#0B1E40] via-[#1C64B4] to-[#0891b2] p-3 sm:p-4 rounded-2xl shadow-xl relative overflow-hidden select-none border border-slate-200">
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-[#0891b2]/60 flex flex-col justify-between min-h-[500px] relative shadow-inner">
                    {/* Fila superior: Logo y Código */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/logo.png"
                                alt="Wylar Casa Certificadora"
                                className="h-8 sm:h-9 object-contain"
                            />
                        </div>
                        <div className="text-right">
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                                Certificado N°
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold text-[#0B1E40] tracking-wide">
                                {code}
                            </span>
                            {categoryLabel && (
                                <div className="mt-1">
                                    <span
                                        className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${
                                            categoryLabel.toLowerCase().includes('chilevalora')
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}
                                    >
                                        {categoryLabel}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cuerpo principal del certificado */}
                    <div className="my-auto py-3 text-center flex flex-col items-center">
                        <h2 className="text-xl sm:text-2xl font-black text-[#0B1E40] tracking-wider uppercase">
                            Certificado
                        </h2>
                        <div className="w-12 h-1 bg-[#0891b2] my-1 rounded-full" />
                        <p className="text-[11px] sm:text-xs font-semibold text-[#1C64B4]">
                            Certificadora de Competencias Laborales Wylar Ltda.
                        </p>

                        <p className="text-[10px] sm:text-[11px] italic text-slate-500 mt-3">
                            Extiende el presente certificado a
                        </p>

                        <p className="text-base sm:text-xl font-extrabold text-[#0B1E40] uppercase tracking-wide mt-1 max-w-lg leading-tight">
                            {displayName}
                        </p>

                        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-600 mt-1">
                            RUT {displayRut}
                        </p>

                        <div className="w-36 sm:w-48 h-px bg-[#0B1E40]/15 my-3" />

                        {/* Ítem 1: Tipo de certificado (frase anterior) */}
                        <div className="relative group max-w-lg">
                            <div className="inline-block relative">
                                <span className="inline-block text-[11px] sm:text-xs text-slate-700 font-medium px-2.5 py-1 rounded-md bg-amber-50/90 border border-amber-300 text-[#0B1E40] shadow-2xs">
                                    {displayLeadIn}
                                </span>
                                <span className="absolute -top-2 -right-2 bg-amber-500 text-[#0B1E40] text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow-xs">
                                    Tipo
                                </span>
                            </div>
                        </div>

                        {/* Nombre de la certificación */}
                        <p className="text-sm sm:text-base font-bold italic text-[#0B1E40] mt-1.5 max-w-lg leading-tight px-2">
                            &ldquo;{displayTitle}&rdquo;
                        </p>

                        {/* Ítem 2: Texto bajo la certificación (opcional) */}
                        {detailText.trim() ? (
                            <div className="relative mt-2.5 max-w-lg px-2">
                                <div className="text-[10px] sm:text-[11px] leading-relaxed text-slate-700 bg-sky-50/90 border border-sky-300 p-2.5 rounded-lg text-center shadow-2xs">
                                    {detailText}
                                </div>
                                <span className="absolute -top-2 right-4 bg-sky-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow-xs">
                                    Texto opcional
                                </span>
                            </div>
                        ) : (
                            <div className="mt-2 text-[10px] text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 px-3 py-1.5 rounded-lg">
                                (Sin texto bajo la certificación — el PDF no mostrará párrafo adicional)
                            </div>
                        )}

                        {/* Fecha de Vigencia */}
                        {vigenciaLabel ? (
                            <p className="text-[10px] sm:text-[11px] font-bold text-[#0B1E40] mt-3">
                                Fecha de Vigencia: <span className="text-[#1C64B4]">{vigenciaLabel}</span>
                            </p>
                        ) : (
                            <p className="text-[9px] text-slate-400 mt-2">
                                Vigencia: Indefinida (sin fecha de vencimiento)
                            </p>
                        )}
                    </div>

                    {/* Fila inferior: QR y Firma */}
                    <div className="flex items-end justify-between gap-4 pt-3 border-t border-slate-100">
                        {/* Bloque QR y verificación */}
                        <div className="flex items-center gap-2.5 max-w-[240px]">
                            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center shrink-0 text-slate-400">
                                <QrCode size={30} className="text-[#0B1E40]" />
                            </div>
                            <div className="text-left text-[8px] leading-tight">
                                <p className="text-slate-500">
                                    Verifica la autenticidad de este certificado en{' '}
                                    <strong className="text-[#0B1E40]">wylar.cl/validador</strong>
                                </p>
                                <p className="font-bold text-[#0B1E40] mt-0.5">{code}</p>
                                <p className="text-slate-400 mt-0.5">Emitido el {formattedIssueDate}</p>
                            </div>
                        </div>

                        {/* Bloque Firma y Timbre */}
                        <div className="relative text-center shrink-0">
                            {/* Timbre superpuesto */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/timbre-wylar.png"
                                alt="Timbre Wylar"
                                className="w-14 h-14 object-contain absolute -top-8 right-1 opacity-85 pointer-events-none"
                            />
                            {/* Firma */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/firma-gustavo.png"
                                alt="Firma Gustavo Soto"
                                className="h-8 object-contain mx-auto relative z-10"
                            />
                            <div className="w-32 h-[1px] bg-slate-800 mx-auto mt-0.5" />
                            <p className="text-[9px] font-bold text-[#0B1E40] mt-0.5">Gustavo Soto Antihual</p>
                            <p className="text-[8px] text-slate-500">Representante Legal</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de estado inferior explicativa */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Validador público habilitado en <strong>wylar.cl/validador</strong>
                </span>
                <span>Tamaño del documento: A4 horizontal</span>
            </div>
        </div>
    );
}
