'use client';

import { useState, useTransition, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    Pencil,
    Plus,
    X,
    Power,
    ArrowLeft,
    Trash2,
    Loader2,
    CheckCircle2,
    Package,
    Info,
    Sparkles,
    Sliders,
    ListPlus,
} from 'lucide-react';
import {
    createProductCategory,
    updateProductCategory,
    toggleProductCategoryActive,
    deleteProductCategory,
    bulkDeleteProductCategories,
    bulkToggleProductCategories,
    updateCategoryFields,
} from '@/actions/productCategories';
import {
    ATTRIBUTE_TEMPLATES,
    attributeTemplateLabel,
    attributeFieldsFor,
    resolveCategoryFields,
    PRODUCT_ATTRIBUTE_SPECS,
    type ProductAttributeField,
    type ProductFieldType,
} from '@/lib/productSpec';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';

interface CategoryRow {
    id: number;
    name: string;
    attributeTemplate: string;
    fields?: unknown;
    active: boolean;
    productsCount?: number;
}

const inputClass =
    'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all text-sm text-slate-900';

export function ProductCategoriesManagement({
    categories,
    isAdmin,
}: {
    categories: CategoryRow[];
    isAdmin: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Formulario de creación
    const [name, setName] = useState('');
    const [attributeTemplate, setAttributeTemplate] = useState('GENERICO');

    // Edición en línea
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editTemplate, setEditTemplate] = useState('GENERICO');

    // Modal de Constructor de Campos Personalizados
    const [editingFieldsCat, setEditingFieldsCat] = useState<CategoryRow | null>(null);
    const [currentFields, setCurrentFields] = useState<ProductAttributeField[]>([]);
    const [isSavingFields, startSaveFields] = useTransition();

    // Borrador para nuevo campo dentro del constructor
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldType, setNewFieldType] = useState<ProductFieldType>('text');
    const [newFieldOptions, setNewFieldOptions] = useState('');
    const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');

    // Multi-selección
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const selectAllRef = useRef<HTMLInputElement>(null);

    const allIds = useMemo(() => categories.map((c) => c.id), [categories]);
    const isAllSelected = categories.length > 0 && selectedIds.length === categories.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < categories.length;

    // Campos de la plantilla seleccionada en creación y edición
    const createFields = useMemo(() => attributeFieldsFor(attributeTemplate), [attributeTemplate]);
    const editFields = useMemo(() => attributeFieldsFor(editTemplate), [editTemplate]);

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = isSomeSelected;
        }
    }, [isSomeSelected]);

    function toggleSelectAll() {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(allIds);
        }
    }

    function toggleSelect(id: number) {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        const formData = new FormData();
        formData.set('name', name);
        formData.set('attributeTemplate', attributeTemplate);
        startTransition(async () => {
            const result = await createProductCategory({}, formData);
            if (result.error) setError(result.error);
            else {
                setSuccess('Categoría creada exitosamente.');
                setName('');
                setAttributeTemplate('GENERICO');
            }
        });
    }

    function startEdit(row: CategoryRow) {
        setError(null);
        setSuccess(null);
        setEditingId(row.id);
        setEditName(row.name);
        setEditTemplate(row.attributeTemplate);
    }

    function cancelEdit() {
        setEditingId(null);
    }

    function handleSaveEdit(id: number) {
        setError(null);
        setSuccess(null);
        const formData = new FormData();
        formData.set('name', editName);
        formData.set('attributeTemplate', editTemplate);
        startTransition(async () => {
            const result = await updateProductCategory(id, {}, formData);
            if (result.error) setError(result.error);
            else {
                setSuccess('Categoría actualizada exitosamente.');
                cancelEdit();
            }
        });
    }

    function handleToggle(id: number) {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await toggleProductCategoryActive(id);
            if (result.error) setError(result.error);
            else setSuccess(result.success ?? null);
        });
    }

    function handleDelete(id: number, catName: string) {
        if (!confirm(`¿Eliminar la categoría "${catName}"? Solo se puede si no tiene productos asociados.`)) return;
        setError(null);
        setSuccess(null);
        setPendingId(id);
        startTransition(async () => {
            const result = await deleteProductCategory(id);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Categoría eliminada.');
                setSelectedIds((prev) => prev.filter((x) => x !== id));
            }
            setPendingId(null);
        });
    }

    function handleBulkDelete() {
        if (!confirm(`¿Eliminar las ${selectedIds.length} categorías seleccionadas?`)) return;
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkDeleteProductCategories(selectedIds);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Categorías eliminadas exitosamente.');
                setSelectedIds([]);
            }
        });
    }

    function handleBulkToggle(active: boolean) {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await bulkToggleProductCategories(selectedIds, active);
            if (result.error) setError(result.error);
            else {
                setSuccess(result.success ?? 'Estado actualizado exitosamente.');
                setSelectedIds([]);
            }
        });
    }

    // Constructor de Campos (Custom Fields Builder)
    function openFieldsEditor(cat: CategoryRow) {
        setError(null);
        setSuccess(null);
        setEditingFieldsCat(cat);
        const fields = resolveCategoryFields(cat);
        setCurrentFields(JSON.parse(JSON.stringify(fields)));
        setNewFieldLabel('');
        setNewFieldType('text');
        setNewFieldOptions('');
        setNewFieldPlaceholder('');
    }

    function closeFieldsEditor() {
        setEditingFieldsCat(null);
        setCurrentFields([]);
    }

    function handleAddField(e: React.FormEvent) {
        e.preventDefault();
        const label = newFieldLabel.trim();
        if (!label) return;

        const baseKey = label
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');

        let uniqueKey = baseKey || `campo_${Date.now()}`;
        if (currentFields.some((f) => f.key === uniqueKey)) {
            uniqueKey = `${uniqueKey}_${Date.now().toString().slice(-4)}`;
        }

        const field: ProductAttributeField = {
            key: uniqueKey,
            label,
            type: newFieldType,
            placeholder: newFieldPlaceholder.trim() || undefined,
        };

        if (newFieldType === 'select') {
            const opts = newFieldOptions
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean);
            if (opts.length === 0) {
                alert('Ingresa al menos una opción para el menú desplegable (separadas por coma).');
                return;
            }
            field.options = opts;
        }

        setCurrentFields([...currentFields, field]);
        setNewFieldLabel('');
        setNewFieldType('text');
        setNewFieldOptions('');
        setNewFieldPlaceholder('');
    }

    function handleRemoveField(index: number) {
        setCurrentFields(currentFields.filter((_, i) => i !== index));
    }

    function handleLoadPreset(templateKey: 'SOLDADURA' | 'CURSO' | 'CHILEVALORA' | 'EMPTY') {
        if (templateKey === 'EMPTY') {
            setCurrentFields([]);
        } else {
            const preset = PRODUCT_ATTRIBUTE_SPECS[templateKey] ?? [];
            setCurrentFields(JSON.parse(JSON.stringify(preset)));
        }
    }

    function handleSaveFields() {
        if (!editingFieldsCat) return;
        startSaveFields(async () => {
            const result = await updateCategoryFields(editingFieldsCat.id, currentFields);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(`Campos de "${editingFieldsCat.name}" guardados exitosamente.`);
                closeFieldsEditor();
            }
        });
    }

    return (
        <div className="space-y-6 relative max-w-4xl">
            {/* Header */}
            <div>
                <Link
                    href="/productos"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B1E40] transition-colors mb-2"
                >
                    <ArrowLeft size={14} /> Volver a Productos
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Categorías de productos</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Clasificación comercial y definición de atributos para los productos y servicios del CRM.
                </p>
            </div>

            {/* Banner explicativo de atributos y constructor */}
            <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-amber-50/50 border border-blue-200/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                    <Info size={18} />
                </div>
                <div className="space-y-1.5 text-xs sm:text-sm">
                    <p className="font-bold text-slate-900">
                        ¿Cómo funcionan las categorías y los atributos personalizables?
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                        Una <strong>Categoría</strong> clasifica tus productos del CRM (ej: <em>Soldadura</em>, <em>Cursos Presenciales</em>, <em>Inspecciones</em>).
                        Cada categoría define qué preguntas o especificaciones técnicas adicionales se deben solicitar en el formulario de producto.
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                        Como <strong>Administrador</strong>, puedes hacer clic en{' '}
                        <span className="font-bold text-[#0B1E40] bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-300">
                            <Sliders size={12} className="inline mr-1" />Configurar campos
                        </span>{' '}
                        en cualquier categoría para <strong>agregar tus propios campos</strong> (texto, números, fechas o listas con tus propias opciones desplegables) sin necesidad de tocar código.
                    </p>
                </div>
            </div>

            {/* Mensajes de feedback */}
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <X size={16} />
                    </button>
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Formulario de creación */}
            <div className="glass-card bg-white p-5 border border-slate-200/90 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                        Nueva categoría de producto
                    </span>
                    <span className="text-xs text-slate-400">
                        Podrás personalizar o agregar nuevos campos después de crearla
                    </span>
                </div>

                <form onSubmit={handleCreate} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-7">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Nombre de la categoría <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej. Soldadura y Fabricación, Cursos Presenciales, Inspecciones..."
                                className={inputClass}
                                required
                            />
                        </div>
                        <div className="sm:col-span-5">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Plantilla base de inicio
                            </label>
                            <Select
                                value={attributeTemplate}
                                onChange={setAttributeTemplate}
                                options={ATTRIBUTE_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
                            />
                        </div>
                    </div>

                    {/* Vista previa en vivo de los campos */}
                    <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Sparkles size={14} className="text-amber-500 shrink-0" />
                            <span className="font-semibold text-slate-700">Campos incluidos en la plantilla:</span>
                            {createFields.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {createFields.map((f) => (
                                        <span key={f.key} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-medium">
                                            {f.label}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-slate-400 italic">Solo campos estándar (Nombre, Descripción, Precio base)</span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="self-end sm:self-auto shrink-0 flex items-center justify-center gap-1.5 bg-[#0B1E40] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[#122b59] transition-colors disabled:opacity-60 text-xs shadow-xs cursor-pointer"
                        >
                            <Plus size={15} /> Agregar categoría
                        </button>
                    </div>
                </form>
            </div>

            {/* Barra flotante de acciones masivas */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0B1E40]/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-cyan-500/30 animate-in fade-in slide-in-from-bottom-4 duration-200 w-[95%] max-w-xl">
                    <div className="flex items-center gap-3">
                        <span className="bg-amber-500 text-[#0B1E40] font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                            {selectedIds.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
                            {selectedIds.length === 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => handleBulkToggle(true)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-200 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                            <CheckCircle2 size={14} /> Activar
                        </button>

                        <button
                            type="button"
                            onClick={() => handleBulkToggle(false)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/20 hover:bg-slate-500 text-slate-200 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                            <Power size={14} /> Desactivar
                        </button>

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={handleBulkDelete}
                                disabled={isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                                <Trash2 size={14} /> Eliminar
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
                            title="Deseleccionar todas"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Listado de categorías */}
            <div className="glass-card bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2.5">
                        <input
                            ref={selectAllRef}
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                            title={isAllSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                        />
                        <span>Categoría</span>
                    </div>
                    <span>Acciones</span>
                </div>

                <ul className="divide-y divide-slate-100">
                    {categories.map((c) => {
                        const isSelected = selectedIds.includes(c.id);
                        const fields = resolveCategoryFields(c);
                        const hasCustomFields = Array.isArray(c.fields) && (c.fields as any[]).length > 0;

                        return editingId === c.id ? (
                            <li key={c.id} className="p-4 bg-amber-50/30 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className={inputClass}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="sm:w-64">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Plantilla base</label>
                                        <Select
                                            value={editTemplate}
                                            onChange={setEditTemplate}
                                            options={ATTRIBUTE_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
                                        />
                                    </div>
                                </div>

                                {/* Preview en edición */}
                                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-slate-700">Campos en producto:</span>
                                    {editFields.length > 0 ? (
                                        editFields.map((f) => (
                                            <span key={f.key} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-[11px]">
                                                {f.label}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-400 italic text-[11px]">Solo datos estándar</span>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSaveEdit(c.id)}
                                        disabled={isPending}
                                        className="px-4 py-1.5 text-xs font-bold bg-[#0B1E40] text-white hover:bg-[#122b59] rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Guardar cambios
                                    </button>
                                </div>
                            </li>
                        ) : (
                            <li
                                key={c.id}
                                className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                                    isSelected ? 'bg-amber-50/40' : 'hover:bg-slate-50/70'
                                } ${c.active ? '' : 'opacity-60 bg-slate-50/30'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(c.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500/30 cursor-pointer shrink-0"
                                    />
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {attributeTemplateLabel(c.attributeTemplate)}
                                            </span>
                                            {hasCustomFields && (
                                                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                                    Campos personalizados ({fields.length})
                                                </span>
                                            )}
                                            {c.productsCount !== undefined && (
                                                <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1">
                                                    <Package size={12} className="text-slate-400" />
                                                    {c.productsCount} {c.productsCount === 1 ? 'producto' : 'productos'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Chips visuales de los atributos */}
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                                            <span className="text-[11px] text-slate-400">Campos en formulario:</span>
                                            {fields.length === 0 ? (
                                                <span className="text-slate-400 italic text-[11px]">
                                                    Estándar (sin atributos extra)
                                                </span>
                                            ) : (
                                                fields.map((f) => (
                                                    <span key={f.key} className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200/60 px-1.5 py-0.5 rounded font-medium">
                                                        {f.label} {f.type === 'select' ? `(${f.options?.length || 0} opciones)` : ''}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Botón principal: Configurar campos personalizados */}
                                        <button
                                            type="button"
                                            onClick={() => openFieldsEditor(c)}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1E40] bg-amber-100/70 hover:bg-amber-200/80 border border-amber-300/80 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                                            title="Configurar campos y opciones personalizadas"
                                        >
                                            <Sliders size={13} className="text-amber-700" />
                                            <span>Configurar campos</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => startEdit(c)}
                                            className="p-1.5 text-slate-400 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Renombrar categoría"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggle(c.id)}
                                            disabled={isPending}
                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                                            title={c.active ? 'Desactivar' : 'Activar'}
                                        >
                                            <Power size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(c.id, c.name)}
                                            disabled={isPending && pendingId === c.id}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Eliminar categoría"
                                        >
                                            {isPending && pendingId === c.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}

                    {categories.length === 0 && (
                        <li className="py-12 text-center text-slate-400 text-sm">
                            Sin categorías registradas en el catálogo.
                        </li>
                    )}
                </ul>
            </div>

            {/* MODAL CONSTRUCTOR DE ATRIBUTOS PARA EL ADMIN */}
            <Modal
                open={editingFieldsCat != null}
                onClose={closeFieldsEditor}
                title={`Configurar campos de: ${editingFieldsCat?.name ?? ''}`}
            >
                <div className="space-y-5">
                    <p className="text-xs text-slate-500 -mt-2">
                        Agrega, modifica o elimina los campos y opciones que el CRM solicitará al registrar productos en esta categoría.
                    </p>

                    {/* Barra de presets rápidos */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block">
                            Cargar plantilla rápida de inicio:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                                type="button"
                                onClick={() => handleLoadPreset('CURSO')}
                                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-900 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Plantilla Curso (horas, fechas, lugar)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLoadPreset('SOLDADURA')}
                                className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Plantilla Soldadura (técnica, posición)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLoadPreset('CHILEVALORA')}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Plantilla ChileValora
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLoadPreset('EMPTY')}
                                className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Limpiar todo (sin campos)
                            </button>
                        </div>
                    </div>

                    {/* Listado de campos configurados actualmente */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                Campos configurados ({currentFields.length})
                            </span>
                            <span className="text-[11px] text-slate-400">
                                Se mostrarán en este orden en el formulario de producto
                            </span>
                        </div>

                        {currentFields.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-xs">
                                Esta categoría actualmente no tiene campos adicionales. Usa el formulario inferior para agregar el primero o carga una plantilla rápida.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {currentFields.map((field, idx) => (
                                    <div
                                        key={field.key + idx}
                                        className="bg-white border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-black text-slate-900">{field.label}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {field.type === 'text' && 'Texto simple'}
                                                    {field.type === 'number' && 'Número'}
                                                    {field.type === 'date' && 'Fecha'}
                                                    {field.type === 'select' && 'Menú desplegable'}
                                                </span>
                                            </div>

                                            {/* Preview de opciones para selects */}
                                            {field.type === 'select' && field.options && field.options.length > 0 && (
                                                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                                    <span className="text-[10px] text-slate-400">Opciones:</span>
                                                    {field.options.map((opt, oIdx) => (
                                                        <span
                                                            key={oIdx}
                                                            className="text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200/60 px-1.5 py-0.5 rounded"
                                                        >
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {field.placeholder && (
                                                <p className="text-[11px] text-slate-400 italic">
                                                    Ayuda: &ldquo;{field.placeholder}&rdquo;
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveField(idx)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                            title="Eliminar campo"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Formulario para agregar un nuevo campo */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <ListPlus size={15} className="text-amber-600" />
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                Agregar un nuevo campo personalizado
                            </span>
                        </div>

                        <form onSubmit={handleAddField} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                <div className="sm:col-span-7">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Nombre de la etiqueta <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={newFieldLabel}
                                        onChange={(e) => setNewFieldLabel(e.target.value)}
                                        placeholder="Ej: Modalidad, Código SENCE, Norma de fabricación..."
                                        className={inputClass}
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-5">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Tipo de dato <span className="text-red-500">*</span>
                                    </label>
                                    <Select
                                        value={newFieldType}
                                        onChange={(v) => setNewFieldType(v as ProductFieldType)}
                                        options={[
                                            { value: 'text', label: 'Texto simple' },
                                            { value: 'number', label: 'Número' },
                                            { value: 'date', label: 'Fecha' },
                                            { value: 'select', label: 'Menú desplegable (opciones)' },
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Campo de opciones si es select */}
                            {newFieldType === 'select' && (
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Opciones del menú desplegable <span className="text-red-500">* (separadas por coma)</span>
                                    </label>
                                    <input
                                        value={newFieldOptions}
                                        onChange={(e) => setNewFieldOptions(e.target.value)}
                                        placeholder="Ej: Presencial, E-learning Asincrónico, E-learning Sincrónico, Híbrido"
                                        className={inputClass}
                                        required
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        Escribe cada opción separada por una coma (,).
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                <input
                                    value={newFieldPlaceholder}
                                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                                    placeholder="Texto de ayuda / placeholder opcional..."
                                    className="w-full sm:flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700"
                                />
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 bg-[#0B1E40] hover:bg-[#122b59] text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
                                >
                                    <Plus size={14} /> Agregar a la lista
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Botones de acción modal */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={closeFieldsEditor}
                            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveFields}
                            disabled={isSavingFields}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                        >
                            {isSavingFields ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" /> Guardando campos…
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={14} /> Guardar configuración de campos
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
