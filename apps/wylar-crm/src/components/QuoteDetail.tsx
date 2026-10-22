'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Mail, CheckCircle2, XCircle, ExternalLink, Calendar, FileText, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { markQuoteAccepted, markQuoteRejected } from '@/actions/quotes';
import { SendQuoteModal } from '@/components/SendQuoteModal';
import { formatChileanMobile } from '@/lib/phone';

interface QuoteDetailProps {
    quote: {
        id: number;
        code: string;
        version: number;
        status: string;
        issueDate: Date | string;
        notes?: string | null;
        total: number;
        createdAt: Date | string;
        createdById?: number | null;
        createdBy?: { id: number; name: string } | null;
        opportunity: {
            id: number;
            code: string;
            name: string;
            rut?: string | null;
            email: string;
            phone: string;
            company?: string | null;
            comuna?: string | null;
            certificationInterest?: string | null;
            status: string;
        };
        items: Array<{
            id: number;
            description: string;
            quantity: number;
            unitPrice: number;
            subtotal: number;
        }>;
    };
}

const STATUS_STYLE: Record<string, string> = {
    BORRADOR: 'bg-slate-100 text-slate-700 border-slate-200',
    ENVIADA: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    REEMPLAZADA: 'bg-slate-100 text-slate-400 border-slate-200',
    ACEPTADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    RECHAZADA: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_LABEL: Record<string, string> = {
    BORRADOR: 'Borrador',
    ENVIADA: 'Enviada al cliente',
    REEMPLAZADA: 'Reemplazada (Histórica)',
    ACEPTADA: 'Aceptada (Ganada)',
    RECHAZADA: 'Rechazada',
};

function money(amount: number) {
    return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

export function QuoteDetail({ quote }: QuoteDetailProps) {
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [, startTransition] = useTransition();

    const clientName = quote.opportunity.name.toUpperCase();
    const company = quote.opportunity.company?.toUpperCase();
    const formattedPhone = formatChileanMobile(quote.opportunity.phone) ?? quote.opportunity.phone;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Barra superior con navegación y acciones rápidas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/cotizaciones"
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black text-slate-900">{quote.code}</h1>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                Versión {quote.version}
                            </span>
                            <span className={clsx('text-xs font-bold px-3 py-1 rounded-full border shadow-xs', STATUS_STYLE[quote.status])}>
                                {STATUS_LABEL[quote.status] ?? quote.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <Calendar size={13} /> Emitida el {new Date(quote.issueDate).toLocaleDateString('es-CL')}
                            {quote.createdBy && <span>· Creada por {quote.createdBy.name}</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Link
                        href={`/cotizaciones/nueva?leadId=${quote.opportunity.id}&fromQuoteId=${quote.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0B1E40] hover:bg-[#122b59] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        title="Modificar condiciones, ítems o valores generando una nueva versión"
                    >
                        <Pencil size={14} /> Editar / Nueva versión
                    </Link>

                    <a
                        href={`/api/quotes/${quote.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                        <Download size={15} /> Descargar PDF
                    </a>

                    <button
                        type="button"
                        onClick={() => setShowEmailModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                        <Mail size={15} /> Enviar por Correo
                    </button>

                    {(quote.status === 'BORRADOR' || quote.status === 'ENVIADA') && (
                        <>
                            <button
                                type="button"
                                onClick={() => startTransition(async () => { await markQuoteAccepted(quote.id); })}
                                className="flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={15} /> Aceptar
                            </button>
                            <button
                                type="button"
                                onClick={() => startTransition(async () => { await markQuoteRejected(quote.id); })}
                                className="flex items-center gap-1 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                                <XCircle size={15} /> Rechazar
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel Central: Hoja de Cotización Ejecutiva Digital */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card bg-white p-6 sm:p-8 space-y-6 shadow-sm border border-slate-200">
                        {/* Cabecera Corporativa de la Propuesta */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-[#0B1E40]">
                            <div>
                                <span className="text-xs font-black text-blue-700 tracking-wider uppercase block">
                                    Centro Oficial Acreditado ChileValora
                                </span>
                                <h2 className="text-xl font-black text-[#0B1E40] tracking-tight">WYLAR LTDA.</h2>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                    Evaluación y Certificación de Competencias Laborales<br />
                                    contacto@wylar.cl · +56 9 2956 6326 · www.wylar.cl
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:text-right min-w-[180px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Propuesta Económica</span>
                                <span className="text-base font-extrabold text-[#0B1E40] block">{quote.code}</span>
                                <span className="text-xs text-slate-500 block">Fecha: {new Date(quote.issueDate).toLocaleDateString('es-CL')}</span>
                                <span className="text-xs text-slate-500 block">Vigencia: 15 días</span>
                            </div>
                        </div>

                        {/* Ficha Destinatario */}
                        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                Datos del Cliente / Destinatario
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block">Nombre / Razón Social:</span>
                                    <span className="font-bold text-slate-800 text-sm">{clientName}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block">RUT:</span>
                                    <span className="font-semibold text-slate-700">{quote.opportunity.rut || '—'}</span>
                                </div>
                                {company && (
                                    <div>
                                        <span className="text-slate-400 font-medium block">Empresa / Institución:</span>
                                        <span className="font-semibold text-slate-700">{company}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-slate-400 font-medium block">Correo electrónico:</span>
                                    <span className="font-semibold text-slate-700">{quote.opportunity.email.toLowerCase()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block">Teléfono de contacto:</span>
                                    <span className="font-semibold text-slate-700">{formattedPhone}</span>
                                </div>
                                {quote.opportunity.comuna && (
                                    <div>
                                        <span className="text-slate-400 font-medium block">Comuna / Ciudad:</span>
                                        <span className="font-semibold text-slate-700">{quote.opportunity.comuna}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabla de Servicios Cotizados */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-[#0B1E40] text-white">
                                        <th className="py-2.5 px-3 text-center w-10">#</th>
                                        <th className="py-2.5 px-3 text-left">Descripción del Servicio / Certificación</th>
                                        <th className="py-2.5 px-3 text-center w-16">Cant.</th>
                                        <th className="py-2.5 px-3 text-right w-28">P. Unitario</th>
                                        <th className="py-2.5 px-3 text-right w-28">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {quote.items.map((it, idx) => (
                                        <tr key={it.id} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                                            <td className="py-2.5 px-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                                            <td className="py-2.5 px-3 font-semibold text-slate-800">{it.description}</td>
                                            <td className="py-2.5 px-3 text-center font-bold text-slate-700">{it.quantity}</td>
                                            <td className="py-2.5 px-3 text-right text-slate-600">{money(it.unitPrice)}</td>
                                            <td className="py-2.5 px-3 text-right font-bold text-[#0B1E40]">{money(it.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Resumen Económico */}
                        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
                            <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                                <span className="font-bold text-slate-700 block uppercase tracking-wide">
                                    Condiciones Comerciales y Pago
                                </span>
                                {quote.notes && quote.notes.trim() ? (
                                    <ul className="text-slate-600 space-y-1.5 list-disc list-inside">
                                        {quote.notes
                                            .split('\n')
                                            .map((line) => line.trim())
                                            .filter(Boolean)
                                            .map((cond, idx) => (
                                                <li key={idx} className="leading-relaxed">
                                                    {cond}
                                                </li>
                                            ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-400 italic">No se especificaron condiciones particulares para esta propuesta.</p>
                                )}
                            </div>

                            <div className="w-full sm:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal Neto:</span>
                                    <span className="font-bold text-slate-800">{money(quote.total)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>IVA (Exento):</span>
                                    <span className="font-bold text-slate-800">$0</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t-2 border-[#0B1E40] text-sm">
                                    <span className="font-black text-[#0B1E40]">TOTAL CLP:</span>
                                    <span className="font-black text-blue-700 text-base">{money(quote.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Derecho: Oportunidad Relacionada & Acciones */}
                <div className="space-y-6">
                    <div className="glass-card p-5 bg-white space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                <ExternalLink size={16} className="text-[#0B1E40]" /> Oportunidad Relacionada
                            </h3>
                            <Link
                                href={`/leads/${quote.opportunity.id}`}
                                className="text-xs font-bold text-blue-700 hover:underline"
                            >
                                Abrir lead →
                            </Link>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Código:</span>
                                <span className="font-bold text-slate-800">{quote.opportunity.code}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Estado del lead:</span>
                                <span className="font-semibold text-slate-700">{quote.opportunity.status}</span>
                            </div>
                            {quote.opportunity.certificationInterest && (
                                <div>
                                    <span className="text-slate-400 font-medium block">Interés de certificación:</span>
                                    <span className="font-bold text-slate-800">{quote.opportunity.certificationInterest}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex gap-2">
                            <a
                                href={`tel:${formattedPhone}`}
                                className="flex-1 py-2 px-3 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                            >
                                📞 Llamar
                            </a>
                            <a
                                href={`mailto:${quote.opportunity.email}`}
                                className="flex-1 py-2 px-3 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                            >
                                ✉️ Email
                            </a>
                        </div>
                    </div>

                    {/* Previsualización del Documento PDF */}
                    <div className="glass-card p-5 bg-white space-y-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                            <FileText size={16} className="text-[#0B1E40]" /> Documento PDF Oficial
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            El PDF se genera al vuelo con el formato institucional oficial, membrete de Wylar, acreditación ChileValora y detalle de ítems.
                        </p>
                        <a
                            href={`/api/quotes/${quote.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                        >
                            <ExternalLink size={14} /> Abrir PDF en pestaña nueva
                        </a>
                    </div>
                </div>
            </div>

            <SendQuoteModal
                quoteId={quote.id}
                quoteCode={quote.code}
                clientName={quote.opportunity.name}
                defaultEmail={quote.opportunity.email}
                totalAmount={quote.total}
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
            />
        </div>
    );
}
