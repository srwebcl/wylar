'use client';

import { useState, useTransition } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { sendQuoteByEmail } from '@/actions/quotes';

interface SendQuoteModalProps {
    quoteId: number;
    quoteCode: string;
    clientName: string;
    defaultEmail: string;
    totalAmount: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function SendQuoteModal({
    quoteId,
    quoteCode,
    clientName,
    defaultEmail,
    totalAmount,
    isOpen,
    onClose,
    onSuccess,
}: SendQuoteModalProps) {
    const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
    const [customMessage, setCustomMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    if (!isOpen) return null;

    function handleSend(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        startTransition(async () => {
            const res = await sendQuoteByEmail(quoteId, {
                recipientEmail,
                customMessage: customMessage.trim() || undefined,
            });

            if (res.error) {
                setError(res.error);
            } else {
                setSuccess(res.success || 'Cotización enviada con éxito.');
                setTimeout(() => {
                    onSuccess?.();
                    onClose();
                }, 1500);
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="bg-gradient-to-r from-[#0B1E40] to-[#122b59] p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white/10">
                            <Mail size={20} className="text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base leading-tight">Enviar Cotización por Correo</h3>
                            <p className="text-xs text-slate-300 font-mono mt-0.5">{quoteCode}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSend} className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                            <AlertCircle size={16} className="shrink-0" /> {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={16} className="shrink-0" /> {success}
                        </div>
                    )}

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Cliente:</span>
                            <span className="font-bold text-slate-900">{clientName.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Total cotizado:</span>
                            <span className="font-extrabold text-[#0B1E40]">${Math.round(totalAmount).toLocaleString('es-CL')} CLP</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200 text-slate-500 text-[11px]">
                            <FileText size={13} className="text-blue-600 shrink-0" />
                            <span>Se generará y adjuntará automáticamente el PDF oficial <strong>Cotizacion-{quoteCode}.pdf</strong>.</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                            Correo destinatario
                        </label>
                        <input
                            type="email"
                            required
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="cliente@ejemplo.cl"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                            Mensaje personalizado <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Ej: Estimado don Gustavo, adjunto la propuesta con el descuento acordado en nuestra reunión..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-slate-900 resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                        >
                            {isPending ? (
                                <>Enviando correo con PDF...</>
                            ) : (
                                <>
                                    <Send size={14} /> Enviar Cotización
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
