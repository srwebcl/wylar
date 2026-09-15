// Especificación del Catálogo de Perfiles (Módulo de Catálogo).
//
// wylar.cl hoy tiene el catálogo hardcodeado en su propio
// src/data/perfiles.js, repartido en 3 plantillas de ficha con bloques de
// contenido muy distintos entre sí. Esta especificación describe, por
// plantilla, qué secciones existen y qué forma tiene cada una — es lo que
// genera dinámicamente el formulario de /catalogo (un editor de secciones
// genérico) y valida src/lib/validation.ts, en vez de tener un formulario
// distinto hardcodeado por cada uno de los ~20 bloques de contenido.

export const PROFILE_TEMPLATE_TYPES = [
    { value: 'CHILEVALORA', label: 'ChileValora (certificación de competencias)' },
    { value: 'SOLDADURA', label: 'Soldadura (calificación técnica)' },
    { value: 'OPERADORES', label: 'Operadores (certificación privada)' },
] as const;

export type ProfileTemplateType = (typeof PROFILE_TEMPLATE_TYPES)[number]['value'];
export const PROFILE_TEMPLATE_TYPE_VALUES = PROFILE_TEMPLATE_TYPES.map((t) => t.value) as [string, ...string[]];

export function profileTemplateLabel(value: string): string {
    return PROFILE_TEMPLATE_TYPES.find((t) => t.value === value)?.label ?? value;
}

export const TARGET_AUDIENCES = [
    { value: 'personas', label: 'Personas' },
    { value: 'empresas', label: 'Empresas' },
    { value: 'otec', label: 'OTEC' },
] as const;
export const TARGET_AUDIENCE_VALUES = TARGET_AUDIENCES.map((t) => t.value) as [string, ...string[]];

// Forma de las filas (ProfileSectionItem) que puede tener una sección:
//  - 'none':    la sección no lleva ítems (solo title/text/intro/closing/note)
//  - 'text':    viñetas simples, ej. tituloBullets, materiales.items
//  - 'titled':  tarjetas {title, text}, ej. ucls, proceso, quienesPueden
//  - 'coded':   ítems con código, ej. procesos de soldadura ({code, text})
//  - 'grouped': ítems agrupados, ej. posiciones ({group, text})
export type SectionItemShape = 'none' | 'text' | 'titled' | 'coded' | 'grouped';

export interface ProfileSectionSpec {
    key: string;
    label: string;
    hasTitle?: boolean;
    hasText?: boolean;
    hasIntro?: boolean;
    hasClosing?: boolean;
    hasNote?: boolean;
    itemShape: SectionItemShape;
    itemLabel?: string;
}

export const PROFILE_SECTION_SPECS: Record<ProfileTemplateType, ProfileSectionSpec[]> = {
    CHILEVALORA: [
        { key: 'importante', label: 'Aviso "No es un curso"', hasText: true, hasIntro: true, hasClosing: true, itemShape: 'text', itemLabel: 'Forma en que se pudo aprender el oficio' },
        { key: 'quienesPueden', label: 'Quiénes pueden certificarse', hasIntro: true, hasClosing: true, itemShape: 'text', itemLabel: 'Viñeta' },
        { key: 'ucls', label: 'Qué se evalúa (Unidades de Competencia)', hasIntro: true, itemShape: 'titled', itemLabel: 'Competencia evaluada' },
        { key: 'queEs', label: 'Qué es la certificación', hasText: true, itemShape: 'none' },
        { key: 'porQueCertificar', label: 'Por qué certificarse', hasClosing: true, itemShape: 'text', itemLabel: 'Beneficio' },
        { key: 'proceso', label: 'Proceso de certificación', itemShape: 'titled', itemLabel: 'Paso del proceso' },
        { key: 'cierre', label: 'Cierre / llamado a la acción', hasTitle: true, hasNote: true, itemShape: 'text', itemLabel: 'Párrafo de cierre' },
        { key: 'alert', label: 'Alerta destacada (opcional, ej. licencia SEC)', hasTitle: true, hasText: true, itemShape: 'none' },
    ],
    SOLDADURA: [
        { key: 'queEs', label: 'Qué es la calificación', itemShape: 'text', itemLabel: 'Párrafo' },
        { key: 'procesos', label: 'Procesos de soldadura', hasNote: true, itemShape: 'coded', itemLabel: 'Proceso (código + nombre)' },
        { key: 'posiciones', label: 'Posiciones evaluadas', hasNote: true, itemShape: 'grouped', itemLabel: 'Posición (grupo: placa/tubería)' },
        { key: 'materiales', label: 'Materiales', hasNote: true, itemShape: 'text', itemLabel: 'Material' },
        { key: 'normas', label: 'Norma de referencia', hasTitle: true, hasText: true, itemShape: 'none' },
        { key: 'aMedida', label: 'Calificaciones a la medida', hasTitle: true, hasText: true, hasClosing: true, itemShape: 'text', itemLabel: 'Aspecto considerado' },
        { key: 'incluye', label: 'Qué incluye el servicio', itemShape: 'text', itemLabel: 'Ítem incluido' },
        { key: 'quienesPueden', label: 'Quiénes pueden calificarse', itemShape: 'titled', itemLabel: 'Perfil (persona/empresa/OTEC)' },
        { key: 'proceso', label: 'Proceso de calificación', itemShape: 'titled', itemLabel: 'Paso del proceso' },
        { key: 'trazabilidad', label: 'Trazabilidad y verificación', hasTitle: true, hasText: true, hasClosing: true, itemShape: 'text', itemLabel: 'Dato verificable' },
        { key: 'cierre', label: 'Cierre / llamado a la acción', hasTitle: true, hasClosing: true, itemShape: 'text', itemLabel: 'Motivo para calificarse' },
    ],
    OPERADORES: [
        { key: 'intro', label: 'Introducción (certificación privada Wylar)', hasTitle: true, hasText: true, itemShape: 'none' },
        { key: 'necesitasOtro', label: '¿Necesitas otro perfil?', hasText: true, itemShape: 'none' },
        { key: 'aMedida', label: 'Certificación a la medida', hasTitle: true, hasText: true, itemShape: 'none' },
        { key: 'quienesPueden', label: 'Quiénes pueden certificarse', itemShape: 'titled', itemLabel: 'Perfil (persona/empresa/OTEC)' },
        { key: 'proceso', label: 'Proceso de certificación', itemShape: 'titled', itemLabel: 'Paso del proceso' },
        { key: 'incluye', label: 'Qué incluye la evaluación', hasIntro: true, hasNote: true, itemShape: 'text', itemLabel: 'Ítem incluido' },
        { key: 'verificables', label: 'Certificaciones verificables en línea', hasTitle: true, hasText: true, itemShape: 'none' },
        { key: 'porQueCertificar', label: 'Por qué certificarse', hasIntro: true, itemShape: 'text', itemLabel: 'Beneficio' },
        { key: 'oportunidades', label: 'Oportunidades laborales', itemShape: 'titled', itemLabel: 'Oportunidad' },
        { key: 'cierre', label: 'Cierre / llamado a la acción', hasTitle: true, hasClosing: true, itemShape: 'text', itemLabel: 'Motivo para certificarse' },
    ],
};

export function sectionSpecsFor(templateType: string): ProfileSectionSpec[] {
    return PROFILE_SECTION_SPECS[templateType as ProfileTemplateType] ?? [];
}

// Etiqueta sugerida para Certificate.categoryLabel al emitir un certificado
// ligado a un perfil de esta plantilla (ver src/actions/certificates.ts).
export function suggestedCategoryLabel(templateType: string): string {
    switch (templateType) {
        case 'CHILEVALORA':
            return 'Certificación ChileValora';
        case 'SOLDADURA':
            return 'Calificación Técnica';
        case 'OPERADORES':
            return 'Certificación Privada Wylar';
        default:
            return 'Certificación Wylar';
    }
}
