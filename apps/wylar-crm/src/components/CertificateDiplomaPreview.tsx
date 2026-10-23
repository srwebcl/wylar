'use client';

import { useMemo } from 'react';
import { Award, QrCode } from 'lucide-react';
import { isValidRut, formatRut } from '@/lib/rut';

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
    const displayRut = holderRut.trim() ? (isValidRut(holderRut) ? formatRut(holderRut) : holderRut) : 'XX.XXX.XXX-X';
    const displayTitle = certificationTitle.trim() || 'Nombre de la certificación';
    const displayLeadIn = completionText.trim() || 'Ha completado satisfactoriamente el curso de';

    return (
        <div className="space-y-2">
            {/* Barra superior compacta con leyenda */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                    <Award size={15} className="text-amber-500" />
                    <span>Pre-formato del Diploma (PDF)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Tipo de certificado
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Texto bajo cert.
                    </span>
                </div>
            </div>

            {/* Marco del Diploma fiel al PDF final */}
            <div className="bg-gradient-to-br from-[#0B1E40] via-[#1C64B4] to-[#0891b2] p-2.5 sm:p-3.5 rounded-xl shadow-lg border border-slate-200 select-none">
                <div className="bg-white rounded-lg p-3 sm:p-5 border border-[#0891b2]/60 flex flex-col justify-between shadow-inner text-center">
                    {/* Fila superior: Logo y Código */}
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/logo.png"
                                alt="Wylar Casa Certificadora"
                                className="h-6 sm:h-7 object-contain"
                            />
                        </div>
                        <div className="text-right">
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-semibold">
                                Certificado N°
                            </span>
                            <span className="text-[11px] sm:text-xs font-black text-[#0B1E40] tracking-wide">
                                {code}
                            </span>
                            {categoryLabel && (
                                <div className="mt-0.5">
                                    <span
                                        className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold border ${
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

                    {/* Cuerpo central del diploma */}
                    <div className="py-2.5 text-center flex flex-col items-center justify-center">
                        <h2 className="text-base sm:text-lg font-black text-[#0B1E40] tracking-widest uppercase">
                            Certificado
                        </h2>
                        <div className="w-8 h-0.5 bg-[#0891b2] my-0.5 rounded-full" />
                        <p className="text-[9.5px] sm:text-[10px] font-semibold text-[#1C64B4]">
                            Certificadora de Competencias Laborales Wylar Ltda.
                        </p>

                        <p className="text-[9px] sm:text-[10px] italic text-slate-400 mt-2">
                            Extiende el presente certificado a
                        </p>

                        <p className="text-xs sm:text-base font-extrabold text-[#0B1E40] uppercase tracking-wide mt-0.5 max-w-md leading-tight break-words">
                            {displayName}
                        </p>

                        <p className="text-[9px] sm:text-[10px] font-semibold text-slate-600 mt-0.5">
                            RUT {displayRut}
                        </p>

                        <div className="w-28 sm:w-36 h-px bg-[#0B1E40]/15 my-2" />

                        {/* Ítem 1: Tipo de certificado (frase anterior) */}
                        <div className="max-w-md">
                            <span className="inline-block text-[10.5px] sm:text-[11.5px] text-amber-950 font-medium px-2 py-0.5 rounded bg-amber-50/90 border border-amber-300/80">
                                {displayLeadIn}
                            </span>
                        </div>

                        {/* Nombre de la certificación */}
                        <p className="text-xs sm:text-sm font-bold italic text-[#0B1E40] mt-1 max-w-md leading-tight px-2">
                            &ldquo;{displayTitle}&rdquo;
                        </p>

                        {/* Ítem 2: Texto bajo la certificación (opcional) */}
                        {detailText.trim() ? (
                            <div className="mt-1.5 max-w-md w-full px-2">
                                <p className="text-[9.5px] sm:text-[10px] leading-relaxed text-slate-700 bg-sky-50/80 border border-sky-200/80 p-2 rounded-md text-center">
                                    {detailText}
                                </p>
                            </div>
                        ) : (
                            <p className="text-[9px] text-slate-300 italic mt-0.5">
                                [Sin párrafo adicional bajo la certificación]
                            </p>
                        )}

                        {/* Fecha de Vigencia */}
                        {vigenciaLabel ? (
                            <p className="text-[9.5px] sm:text-[10px] font-bold text-[#0B1E40] mt-1.5">
                                Fecha de Vigencia: <span className="text-[#1C64B4]">{vigenciaLabel}</span>
                            </p>
                        ) : (
                            <p className="text-[8.5px] text-slate-400 mt-1">
                                Vigencia: Indefinida (sin fecha de vencimiento)
                            </p>
                        )}
                    </div>

                    {/* Fila inferior: QR y Firma */}
                    <div className="flex items-end justify-between gap-2 pt-2 border-t border-slate-100">
                        {/* Bloque QR */}
                        <div className="flex items-center gap-1.5 max-w-[200px] text-left">
                            <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded flex items-center justify-center shrink-0">
                                <QrCode size={22} className="text-[#0B1E40]" />
                            </div>
                            <div className="text-[7.5px] leading-tight text-slate-500">
                                <p>wylar.cl/validador</p>
                                <p className="font-bold text-[#0B1E40]">{code}</p>
                                <p className="text-slate-400">Emitido {formattedIssueDate}</p>
                            </div>
                        </div>

                        {/* Bloque Firma y Timbre */}
                        <div className="relative text-center shrink-0">
                            {/* Timbre superpuesto */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/timbre-wylar.png"
                                alt="Timbre Wylar"
                                className="w-10 h-10 object-contain absolute -top-5 right-0 opacity-80 pointer-events-none"
                            />
                            {/* Firma */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/firma-gustavo.png"
                                alt="Firma Gustavo Soto"
                                className="h-6 object-contain mx-auto relative z-10"
                            />
                            <div className="w-24 h-[1px] bg-slate-800 mx-auto mt-0.5" />
                            <p className="text-[8px] font-bold text-[#0B1E40] leading-none mt-0.5">Gustavo Soto Antihual</p>
                            <p className="text-[7.5px] text-slate-400 leading-none">Representante Legal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
