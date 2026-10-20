'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { FileText, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { createQuote, markQuoteAccepted, markQuoteRejected, type QuoteFormState } from '@/actions/quotes';
import type { Quote, QuoteItem } from '@prisma/client';

type QuoteWithItems = Quote & { items: QuoteItem[] };

interface ProductOption {
    id: number;
    name: string;
    price: unknown; // Prisma.Decimal serializado — se castea a number al usarlo
}

const STATUS_STYLE: Record<string, string> = {
    BORRADOR: 'bg-slate-100 text-slate-600',
    ENVIADA: 'bg-cyan-50 text-cyan-700',
    REEMPLAZADA: 'bg-slate-100 text-slate-400',
    ACEPTADA: 'bg-emerald-50 text-emerald-700',
    RECHAZADA: 'bg-red-50 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
    BORRADOR: 'Borrador',
    ENVIADA: 'Enviada',
    REEMPLAZADA: 'Reemplazada',
    ACEPTADA: 'Aceptada',
    RECHAZADA: 'Rechazada',
};

function money(value: number) {
    return `$${Math.round(value).toLocaleString('es-CL')}`;
}

const initialState: QuoteFormState = {};

interface ItemDraft {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export function QuotesPanel({ opportunityId, quotes, products }: { opportunityId: number; quotes: QuoteWithItems[]; products: ProductOption[] }) {
    const [showForm, setShowForm] = useState(false);
    const [items, setItems] = useState<ItemDraft[]>([{ productId: '', description: '', quantity: 1, unitPrice: 0 }]);
    const [notes, setNotes] = useState('');
    const [state, formAction, pending] = useActionState(createQuote, initialState);
    const [, startTransition] = useTransition();

    function addItem() {
        setItems((prev) => [...prev, { productId: '', description: '', quantity: 1, unitPrice: 0 }]);
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function updateItem(index: number, patch: Partial<ItemDraft>) {
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    }

    function handleProductChange(index: number, productId: string) {
        const product = products.find((p) => String(p.id) === productId);
        updateItem(index, { productId, description: product?.name ?? '', unitPrice: product?.price != null ? Number(product.price) : 0 });
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set('opportunityId', String(opportunityId));
        fd.set('notes', notes);
        fd.set(
            'items',
            JSON.stringify(
                items
                    .filter((it) => it.description.trim())
                    .map((it) => ({ productId: it.productId ? Number(it.productId) : null, description: it.description, quantity: it.quantity, unitPrice: it.unitPrice })),
            ),
        );
        formAction(fd);
    }

    useEffect(() => {
        if (state.success) {
            setShowForm(false);
            setItems([{ productId: '', description: '', quantity: 1, unitPrice: 0 }]);
            setNotes('');
        }
    }, [state.success]);

    const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

    return (
        <div className="glass-card overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                    <FileText size={16} className="mr-2 text-[#0B1E40]" /> Cotizaciones
                </h3>
                <button onClick={() => setShowForm((v) => !v)} className="text-xs font-bold text-[#0B1E40] hover:underline flex items-center gap-1">
                    <Plus size={14} /> Nueva
                </button>
            </div>

            <div className="p-5 bg-white space-y-3">
                {showForm && (
                    <form onSubmit={handleSubmit} className="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        {state.error && <p className="text-xs text-red-600 font-medium">{state.error}</p>}
                        <div className="space-y-3">
                            {items.map((item, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 sm:p-0 bg-white sm:bg-transparent rounded-lg border sm:border-0 border-slate-200">
                                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                        <select
                                            value={item.productId}
                                            onChange={(e) => handleProductChange(i, e.target.value)}
                                            className="w-full sm:flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                        >
                                            <option value="">Ítem libre...</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            value={item.description}
                                            onChange={(e) => updateItem(i, { description: e.target.value })}
                                            placeholder="Descripción"
                                            className="w-full sm:flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 justify-between sm:justify-start">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] text-slate-400 font-medium sm:hidden">Cant:</span>
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                                                className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                                placeholder="Cant"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] text-slate-400 font-medium sm:hidden">Precio:</span>
                                            <input
                                                type="number"
                                                min={0}
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) || 0 })}
                                                className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                                placeholder="Precio"
                                            />
                                        </div>
                                        <button type="button" onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-600 p-1 shrink-0 ml-auto sm:ml-0" title="Eliminar ítem">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addItem} className="text-xs font-bold text-[#0B1E40] hover:underline">
                            + Agregar ítem
                        </button>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notas (opcional)"
                            rows={2}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
                            <span className="text-sm font-bold text-slate-700">Total: {money(total)}</span>
                            <button type="submit" disabled={pending} className="w-full sm:w-auto px-4 py-2 bg-[#0B1E40] text-white text-xs font-bold rounded-lg hover:bg-[#122b59] disabled:opacity-60 transition-colors">
                                {pending ? 'Guardando…' : 'Crear cotización'}
                            </button>
                        </div>
                    </form>
                )}

                {quotes.length === 0 && !showForm && <p className="text-sm text-slate-400 text-center py-4">Aún no hay cotizaciones.</p>}

                {quotes.map((q) => (
                    <div key={q.id} className="border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-800 text-sm">
                                {q.code} <span className="text-slate-400 font-normal">v{q.version}</span>
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[q.status]}`}>{STATUS_LABEL[q.status] ?? q.status}</span>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-0.5 mb-2">
                            {q.items.map((it) => (
                                <li key={it.id}>
                                    {it.quantity}× {it.description} — {money(Number(it.unitPrice))}
                                </li>
                            ))}
                        </ul>
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{money(Number(q.total))}</span>
                            {(q.status === 'BORRADOR' || q.status === 'ENVIADA') && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => startTransition(async () => { await markQuoteAccepted(q.id); })}
                                        className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                    >
                                        <CheckCircle2 size={14} /> Aceptada
                                    </button>
                                    <button
                                        onClick={() => startTransition(async () => { await markQuoteRejected(q.id); })}
                                        className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600"
                                    >
                                        <XCircle size={14} /> Rechazada
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
