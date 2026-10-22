'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Plus,
    Trash2,
    FileText,
    User,
    MapPin,
    Mail,
    Phone,
    IdCard,
    Building2,
    Pencil,
    X,
    CheckCircle2,
    AlertCircle,
    ListOrdered,
    Loader2,
} from 'lucide-react';
import { createQuote } from '@/actions/quotes';
import { updateOpportunityFromQuote } from '@/actions/leads';
import { Combobox } from '@/components/ui/Combobox';
import { Button } from '@/components/ui/Button';
import { isValidRut, formatRut } from '@/lib/rut';
import { isValidChileanMobile, formatChileanMobile } from '@/lib/phone';
import { ComunaCombobox } from '@/components/ComunaCombobox';

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

    // Edición rápida de la oportunidad desde la cotización
    const [isEditingLead, setIsEditingLead] = useState(false);
    const [leadEditFields, setLeadEditFields] = useState({
        name: '',
        rut: '',
        email: '',
        phone: '',
        company: '',
        comuna: '',
    });
    const [leadEditError, setLeadEditError] = useState<string | null>(null);
    const [leadEditPending, setLeadEditPending] = useState(false);

    // Condiciones comerciales enlistadas (sin textos por defecto)
    const [conditions, setConditions] = useState<string[]>(['']);

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

    function startEditingLead() {
        if (!selectedLead) return;
        setLeadEditFields({
            name: selectedLead.name,
            rut: selectedLead.rut ?? '',
            email: selectedLead.email,
            phone: selectedLead.phone,
            company: selectedLead.company ?? '',
            comuna: selectedLead.comuna ?? '',
        });
        setLeadEditError(null);
        setIsEditingLead(true);
    }

    async function handleSaveLeadEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedLead) return;
        setLeadEditError(null);

        if (leadEditFields.rut.trim() && !isValidRut(leadEditFields.rut)) {
            setLeadEditError('RUT inválido. Revisa el número y el dígito verificador.');
            return;
        }
        const phoneCanonical = isValidChileanMobile(leadEditFields.phone)
            ? leadEditFields.phone
            : formatChileanMobile(leadEditFields.phone);
        if (!phoneCanonical) {
            setLeadEditError('Teléfono inválido. Debe ser un celular chileno (+56 9 XXXX XXXX).');
            return;
        }

        setLeadEditPending(true);
        try {
            const res = await updateOpportunityFromQuote(selectedLead.id, {
                name: leadEditFields.name,
                rut: leadEditFields.rut.trim() ? formatRut(leadEditFields.rut) : null,
                email: leadEditFields.email,
                phone: phoneCanonical,
                company: leadEditFields.company.trim() || null,
                comuna: leadEditFields.comuna.trim() || null,
            });

            if (res.error) {
                setLeadEditError(res.error);
            } else if (res.lead) {
                setSelectedLead(res.lead);
                setIsEditingLead(false);
            }
        } catch (err) {
            setLeadEditError('Error al guardar cambios de la oportunidad.');
        } finally {
            setLeadEditPending(false);
        }
    }

    function addCondition() {
        setConditions((prev) => [...prev, '']);
    }

    function removeCondition(index: number) {
        if (conditions.length <= 1) {
            setConditions(['']);
            return;
        }
        setConditions((prev) => prev.filter((_, i) => i !== index));
    }

    function updateCondition(index: number, val: string) {
        setConditions((prev) => prev.map((c, i) => (i === index ? val : c)));
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

        const finalNotes = conditions
            .map((c) => c.trim())
            .filter(Boolean)
            .join('\n');

        const fd = new FormData();
        fd.set('opportunityId', String(selectedLead.id));
        fd.set('status', submitStatus);
        fd.set('notes', finalNotes);
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
                    <p className="text-sm text-slate-500 mt-0.5">
                        Genera una propuesta económica oficial con condiciones personalizadas y emisión de PDF.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm font-medium text-rose-700">
                    {error}
                </div>
            )}

            {/* 1. Oportunidad / Cliente */}
            <div className="glass-card p-5 space-y-4 bg-white">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <User size={16} className="text-[#0B1E40]" /> Oportunidad / Cliente
                    </h2>
                    {selectedLead && (
                        <button
                            type="button"
                            onClick={startEditingLead}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B1E40] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                            <Pencil size={13} /> Editar datos de oportunidad
                        </button>
                    )}
                </div>

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                        <div className="sm:col-span-2 font-bold text-slate-900 flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0B1E40]/10 text-[#0B1E40] font-bold">
                                {selectedLead.code}
                            </span>
                            <span>{selectedLead.name}</span>
                        </div>
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

            {/* Modal para editar los datos de la oportunidad */}
            {isEditingLead && selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="bg-[#0B1E40] text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Pencil size={16} className="text-amber-400" />
                                <h3 className="font-bold text-sm">Editar Datos de la Oportunidad ({selectedLead.code})</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditingLead(false)}
                                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveLeadEdit} className="p-5 space-y-3.5">
                            {leadEditError && (
                                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                                    <AlertCircle size={15} className="shrink-0" /> {leadEditError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={leadEditFields.name}
                                    onChange={(e) => setLeadEditFields((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#0B1E40]/20 uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        value={leadEditFields.email}
                                        onChange={(e) => setLeadEditFields((f) => ({ ...f, email: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#0B1E40]/20 lowercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono Móvil</label>
                                    <input
                                        type="tel"
                                        required
                                        value={leadEditFields.phone}
                                        onChange={(e) => setLeadEditFields((f) => ({ ...f, phone: e.target.value }))}
                                        placeholder="+56 9 1234 5678"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#0B1E40]/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">RUT</label>
                                    <input
                                        type="text"
                                        value={leadEditFields.rut}
                                        onChange={(e) => setLeadEditFields((f) => ({ ...f, rut: e.target.value }))}
                                        placeholder="12.345.678-5"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#0B1E40]/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Empresa</label>
                                    <input
                                        type="text"
                                        value={leadEditFields.company}
                                        onChange={(e) => setLeadEditFields((f) => ({ ...f, company: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#0B1E40]/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Comuna</label>
                                <ComunaCombobox
                                    value={leadEditFields.comuna}
                                    onChange={(val) => setLeadEditFields((f) => ({ ...f, comuna: val }))}
                                    placeholder="Selecciona o busca comuna..."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditingLead(false)}
                                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={leadEditPending}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0B1E40] hover:bg-[#122b59] text-white text-xs font-bold rounded-lg transition-all disabled:opacity-60"
                                >
                                    {leadEditPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                    Guardar cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                        Producto del catálogo (opcional)
                                    </label>
                                    <Combobox
                                        value={it.productId ? Number(it.productId) : null}
                                        onChange={(id) => handleProductChange(i, id)}
                                        options={products.map((p) => ({
                                            id: p.id,
                                            label: p.name,
                                            sublabel: p.price != null ? money(p.price) : undefined,
                                        }))}
                                        placeholder="Ítem personalizado..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                        Descripción en la cotización
                                    </label>
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
                                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-navy-900 text-right">
                                        {money(it.quantity * it.unitPrice)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Condiciones Comerciales Enlistadas */}
            <div className="glass-card p-5 space-y-4 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <ListOrdered size={16} className="text-[#0B1E40]" /> Condiciones Comerciales
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Escribe y enlista cada condición o término de la propuesta. No se muestran textos por defecto.
                        </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addCondition}>
                        Agregar condición
                    </Button>
                </div>

                <div className="space-y-2.5">
                    {conditions.map((cond, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                            </span>
                            <input
                                type="text"
                                value={cond}
                                onChange={(e) => updateCondition(idx, e.target.value)}
                                placeholder={
                                    idx === 0
                                        ? 'Ej: Validez de la oferta: 15 días corridos a partir de la emisión.'
                                        : idx === 1
                                        ? 'Ej: Forma de pago: Transferencia electrónica a 30 días con orden de compra.'
                                        : 'Ej: Incluye evaluación teórica y práctica en faena...'
                                }
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] focus:bg-white transition-all text-slate-900"
                            />
                            {conditions.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeCondition(idx)}
                                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                                    title="Eliminar condición"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
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
