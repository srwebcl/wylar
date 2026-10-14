// Especificación del Catálogo de Productos (distinto del Catálogo de
// Perfiles de marketing, ver catalogSpec.ts).
//
// Cada ProductCategory elige una "plantilla de atributos" de esta lista —
// agregar una categoría nueva nunca exige tocar código (se crea desde
// /productos/categorias eligiendo una plantilla existente); solo agregar
// una FORMA de atributos nueva (ej. un campo que ninguna plantilla actual
// tiene) exige sumar una entrada acá, igual que agregar un templateType a
// Profile en catalogSpec.ts.

export type ProductFieldType = 'text' | 'select' | 'number' | 'date';

export interface ProductAttributeField {
    key: string;
    label: string;
    type: ProductFieldType;
    options?: string[];
    placeholder?: string;
}

export const ATTRIBUTE_TEMPLATES = [
    { value: 'GENERICO', label: 'Genérico (sin atributos extra)' },
    { value: 'SOLDADURA', label: 'Soldadura (técnica y posición)' },
    { value: 'CHILEVALORA', label: 'ChileValora (perfil ocupacional)' },
    { value: 'CURSO', label: 'Curso (horas, fechas, lugar)' },
] as const;

export type AttributeTemplate = (typeof ATTRIBUTE_TEMPLATES)[number]['value'];
export const ATTRIBUTE_TEMPLATE_VALUES = ATTRIBUTE_TEMPLATES.map((t) => t.value) as [string, ...string[]];

export function attributeTemplateLabel(value: string): string {
    return ATTRIBUTE_TEMPLATES.find((t) => t.value === value)?.label ?? value;
}

export const PRODUCT_ATTRIBUTE_SPECS: Record<AttributeTemplate, ProductAttributeField[]> = {
    GENERICO: [],
    SOLDADURA: [
        {
            key: 'tecnica',
            label: 'Técnica',
            type: 'select',
            options: ['Arco (SMAW)', 'TIG (GTAW)', 'MIG/MAG (GMAW)', 'Oxigás (OFW)', 'Arco Sumergido (SAW)', 'Otra'],
        },
        {
            key: 'posicion',
            label: 'Posición',
            type: 'select',
            options: ['1G', '2G', '3G', '4G', '5G', '6G', '1F', '2F', '3F', '4F'],
        },
    ],
    CHILEVALORA: [{ key: 'perfil', label: 'Perfil ocupacional ChileValora', type: 'text', placeholder: 'Ej: Instalador Eléctrico de Clase D' }],
    CURSO: [
        { key: 'horas', label: 'Duración (horas)', type: 'number' },
        { key: 'fechaInicio', label: 'Fecha de inicio', type: 'date' },
        { key: 'fechaTermino', label: 'Fecha de término', type: 'date' },
        { key: 'lugar', label: 'Lugar', type: 'text', placeholder: 'Ej: Sede Wylar Antofagasta' },
        { key: 'comuna', label: 'Comuna', type: 'text' },
    ],
};

export function attributeFieldsFor(template: string): ProductAttributeField[] {
    return PRODUCT_ATTRIBUTE_SPECS[template as AttributeTemplate] ?? [];
}
