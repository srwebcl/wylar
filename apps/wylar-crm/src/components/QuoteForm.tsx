'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, FileText, User, MapPin } from 'lucide-react';
import { createQuote } from '@/actions/quotes';

interface ProductOption {
    id: number;
    name: string;
    price: unknown;
}

interface LeadOption {
    id: number;
    code: string;
    name: string;
    rut?: string | null;
    email: string;
    phone: string;
    company?: string | null;
    comuna?: string | null;
    certificationInterest?: string | null;
}

interface ItemDraft {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

function money(amount: number) {
    return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

export function QuoteForm({
    leads,
    products,
    initialLeadId,
}: {
    leads: LeadOption[];
    products: ProductOption[];
    initialLeadId?: number;
}) {
    const router = useRouter();
    const [selectedLeadId, setSelectedLeadId] = useState<number | undefined>(initialLeadId);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ItemDraft[]>([
        { productId: '', description: '', quantity: 1, unitPrice: 0 },
    ]);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const selectedLead = leads.find((l) => l.id === selectedLeadId);

    function addItem() {
        setItems((prev) => [...prev, { productId: '', description: '', quantity: 1, unitPrice: 0 }]);
    }

    function removeItem(index: number) {
        if (items.length === 1) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function updateItem(index: number, patch: Partial<ItemDraft>) {
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    }

    function handleProductChange(index: number, productId: string) {
        const product = products.find((p) => String(p.id) === productId);
        updateItem(index, {
            productId,
            description: product ? product.name : '',
            unitPrice: product?.price != null ? Number(product.price) : 0,
        });
    }

    const total = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0);

    function handleSubmit(e: React.FormEvent, submitStatus: 'ENVIADA' | 'BORRADOR') {
        e.preventDefault();
        setError(null);

        if (!selectedLeadId) {
            setError('Debes seleccionar una oportunidad / cliente.');
            return;
        }

        const validItems = items.filter((it) => it.description.trim());
        if (validItems.length === 0) {
            setError('Debes agregar al menos un ítem con descripción a la cotización.');
            return;
        }

        const fd = new FormData();
        fd.set('opportunityId', String(selectedLeadId));
        fd.set('status', submitStatus);
        fd.set('notes', notes);
        fd.set(
            'items',
            JSON.stringify(
                validItems.map((it) => ({
                    productId: it.productId ? Number(it.productId) : null,
                    description: it.description.trim(),
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                })),
            ),
        );

        startTransition(async () => {
            const res = await createQuote({}, fd);
            if (res.error) {
                setError(res.error);
            } else if (res.quoteId) {
                router.push(`/cotizaciones/${res.quoteId}`);
            } else {
                router.push('/cotizaciones');
            }
        });
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href={selectedLeadId ? `/leads/${selectedLeadId}` : '/cotizaciones'}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900">Nueva Cotización</h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Genera una propuesta económica oficial con PDF y opción de envío por correo.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Oportunidad y Cliente */}
                <div className="space-y-6">
                    <div className="glass-card p-5 space-y-4 bg-white">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <User size={16} className="text-[#0B1E40]" /> 1. Oportunidad / Cliente
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                Seleccionar Oportunidad
                            </label>
                            <select
                                value={selectedLeadId ?? ''}
                                onChange={(e) => setSelectedLeadId(e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] cursor-pointer"
                            >
                                <option value="">-- Elige una oportunidad --</option>
                                {leads.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.code} - {l.name.toUpperCase()} {l.company ? `(${l.company.toUpperCase()})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedLead && (
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block">Nombre cliente</span>
                                    <span className="font-bold text-slate-800 text-sm">{selectedLead.name.toUpperCase()}</span>
                                </div>
                                {selectedLead.rut && (
                                    <div>
                                        <span className="text-slate-400 font-medium block">RUT</span>
                                        <span className="font-semibold text-slate-700">{selectedLead.rut}</span>
                                    </div>
                                )}
                                {selectedLead.company && (
                                    <div>
                                        <span className="text-slate-400 font-medium block">Empresa</span>
                                        <span className="font-semibold text-slate-700">{selectedLead.company.toUpperCase()}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-slate-400 font-medium block">Correo</span>
                                    <span className="font-semibold text-slate-700">{selectedLead.email.toLowerCase()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium block">Teléfono</span>
                                    <span className="font-semibold text-slate-700">{selectedLead.phone}</span>
                                </div>
                                {selectedLead.comuna && (
                                    <div className="flex items-center gap-1.5 text-slate-600 font-medium pt-1 border-t border-slate-200">
                                        <MapPin size={12} className="text-slate-400" /> Comuna: {selectedLead.comuna}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-5 space-y-3 bg-white">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                            Condiciones Comerciales
                        </h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                Notas u observaciones adicionales
                            </label>
                            <textarea
                                rows={4}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ej: Se contempla modalidad presencial en faena. Plazo de ejecución 5 días hábiles..."
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Ítems y Totales */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6 bg-white space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                <FileText size={18} className="text-[#0B1E40]" /> 2. Detalle de Ítems a Cotizar
                            </h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                            >
                                <Plus size={14} /> Agregar ítem
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((it, i) => (
                                <div key={i} className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-slate-400">ÍTEM #{i + 1}</span>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(i)}
                                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                                title="Eliminar este ítem"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                                Cargar desde catálogo
                                            </label>
                                            <select
                                                value={it.productId}
                                                onChange={(e) => handleProductChange(i, e.target.value)}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0B1E40]"
                                            >
                                                <option value="">-- Ítem personalizado --</option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                                Descripción en la cotización
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={it.description}
                                                onChange={(e) => updateItem(i, { description: e.target.value })}
                                                placeholder="Ej: Evaluación y Certificación Soldador 1G..."
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0B1E40]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                                Cantidad
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                required
                                                value={it.quantity}
                                                onChange={(e) => updateItem(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none text-center font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                                Precio Unitario (CLP)
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                required
                                                value={it.unitPrice}
                                                onChange={(e) => updateItem(i, { unitPrice: Math.max(0, parseInt(e.target.value) || 0) })}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none font-bold text-right"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 text-right">
                                                Subtotal
                                            </label>
                                            <div className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-[#0B1E40] text-right">
                                                {money(it.quantity * it.unitPrice)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Caja de Totales */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Propuesta</span>
                                <span className="text-2xl font-black text-[#0B1E40]">{money(total)} CLP</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={(e) => handleSubmit(e, 'BORRADOR')}
                                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-60 cursor-pointer"
                                >
                                    Guardar Borrador
                                </button>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={(e) => handleSubmit(e, 'ENVIADA')}
                                    className="px-5 py-2.5 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                                >
                                    {isPending ? 'Guardando...' : 'Crear Cotización Oficial'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
