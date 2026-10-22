'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, FileText, User, MapPin, Mail, Phone, IdCard, Building2 } from 'lucide-react';
import { createQuote } from '@/actions/quotes';
import { Combobox } from '@/components/ui/Combobox';
import { Button } from '@/components/ui/Button';

interface ProductOption {
    id: number;
    name: string;
    price: number | null;
}

interface LeadSummary {
    id: number;
    code: string;
    name: string;
    rut?: string | null;
    email: string;
    phone: string;
    company?: string | null;
    comuna?: string | null;
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

export function QuoteForm({ initialLead, products }: { initialLead: LeadSummary | null; products: ProductOption[] }) {
    const router = useRouter();
    const [selectedLead, setSelectedLead] = useState<LeadSummary | null>(initialLead);
    const [loadingLead, setLoadingLead] = useState(false);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ItemDraft[]>([{ productId: '', description: '', quantity: 1, unitPrice: 0 }]);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleLeadChange(id: string | number | null) {
        if (id == null) {
            setSelectedLead(null);
            return;
        }
        setLoadingLead(true);
        try {
            const res = await fetch(`/api/leads/${id}/summary`);
            const data = await res.json();
            if (data.lead) setSelectedLead(data.lead);
        } finally {
            setLoadingLead(false);
        }
    }

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

    function handleProductChange(index: number, productId: string | number | null) {
        const product = products.find((p) => p.id === productId);
        updateItem(index, {
            productId: productId != null ? String(productId) : '',
            description: product ? product.name : items[index].description,
            unitPrice: product?.price ?? items[index].unitPrice,
        });
    }

    const total = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0);

    function handleSubmit(e: React.SyntheticEvent, submitStatus: 'ENVIADA' | 'BORRADOR') {
        e.preventDefault();
        setError(null);

        if (!selectedLead) {
            setError('Debes seleccionar una oportunidad / cliente.');
            return;
        }

        const validItems = items.filter((it) => it.description.trim());
        if (validItems.length === 0) {
            setError('Debes agregar al menos un ítem con descripción a la cotización.');
            return;
        }

        const fd = new FormData();
        fd.set('opportunityId', String(selectedLead.id));
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
            if (res.error) setError(res.error);
            else if (res.quoteId) router.push(`/cotizaciones/${res.quoteId}`);
            else router.push('/cotizaciones');
        });
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
                <Link
                    href={selectedLead ? `/leads/${selectedLead.id}` : '/cotizaciones'}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Nueva cotización</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Genera una propuesta económica con PDF y opción de envío por correo.</p>
                </div>
            </div>

            {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm font-medium text-rose-700">{error}</div>}

            {/* 1. Oportunidad / Cliente */}
            <div className="glass-card p-5 space-y-4 bg-white">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-navy-900" /> Oportunidad / cliente
                </h2>

                <Combobox
                    value={selectedLead?.id ?? null}
                    onChange={handleLeadChange}
                    searchUrl="/api/leads/search"
                    initialLabel={initialLead ? `${initialLead.code} — ${initialLead.name}` : undefined}
                    initialSublabel={initialLead?.company ?? undefined}
                    placeholder="Busca por nombre, código, RUT o empresa..."
                    disabled={loadingLead}
                />

                {selectedLead && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                        <div className="sm:col-span-2 font-semibold text-slate-800">{selectedLead.name}</div>
                        {selectedLead.rut && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <IdCard size={13} className="text-slate-400" /> {selectedLead.rut}
                            </div>
                        )}
                        {selectedLead.company && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <Building2 size={13} className="text-slate-400" /> {selectedLead.company}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail size={13} className="text-slate-400" /> {selectedLead.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone size={13} className="text-slate-400" /> {selectedLead.phone}
                        </div>
                        {selectedLead.comuna && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                                <MapPin size={13} className="text-slate-400" /> {selectedLead.comuna}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. Ítems */}
            <div className="glass-card p-5 space-y-4 bg-white">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText size={16} className="text-navy-900" /> Ítems a cotizar
                    </h2>
                    <Button type="button" variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addItem}>
                        Agregar ítem
                    </Button>
                </div>

                <div className="space-y-3">
                    {items.map((it, i) => (
                        <div key={i} className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-400">Ítem {i + 1}</span>
                                {items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(i)} className="text-slate-400 hover:text-rose-600 p-1 transition-colors" title="Eliminar este ítem">
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Producto del catálogo (opcional)</label>
                                    <Combobox
                                        value={it.productId ? Number(it.productId) : null}
                                        onChange={(id) => handleProductChange(i, id)}
                                        options={products.map((p) => ({ id: p.id, label: p.name, sublabel: p.price != null ? money(p.price) : undefined }))}
                                        placeholder="Ítem personalizado..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Descripción en la cotización</label>
                                    <input
                                        type="text"
                                        required
                                        value={it.description}
                                        onChange={(e) => updateItem(i, { description: e.target.value })}
                                        placeholder="Ej: Evaluación y Certificación Soldador 1G..."
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={it.quantity}
                                        onChange={(e) => updateItem(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none text-center font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Precio unitario (CLP)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        required
                                        value={it.unitPrice}
                                        onChange={(e) => updateItem(i, { unitPrice: Math.max(0, parseInt(e.target.value) || 0) })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none font-medium text-right"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1 text-right">Subtotal</label>
                                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-navy-900 text-right">{money(it.quantity * it.unitPrice)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Condiciones */}
            <div className="glass-card p-5 space-y-3 bg-white">
                <h2 className="text-sm font-semibold text-slate-700">Condiciones comerciales</h2>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Notas u observaciones (opcional)</label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: Se contempla modalidad presencial en faena. Plazo de ejecución 5 días hábiles..."
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 resize-none"
                    />
                </div>
            </div>

            {/* Total + acciones */}
            <div className="glass-card p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <span className="text-xs font-medium text-slate-400 block">Total propuesta</span>
                    <span className="text-2xl font-bold text-navy-900">{money(total)} CLP</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" disabled={isPending} onClick={(e) => handleSubmit(e, 'BORRADOR')}>
                        Guardar borrador
                    </Button>
                    <Button type="button" variant="primary" loading={isPending} onClick={(e) => handleSubmit(e, 'ENVIADA')}>
                        Crear cotización oficial
                    </Button>
                </div>
            </div>
        </div>
    );
}
