// Catálogos y reglas de negocio del CRM de Wylar. Se mantienen como
// constantes de aplicación (no enums de base de datos) para poder
// ajustarlos sin migraciones.

export const LEAD_TYPES = [
    { value: 'PERSONA', label: 'Persona' },
    { value: 'EMPRESA', label: 'Empresa' },
    { value: 'INSTITUCION', label: 'Institución de Educación' },
] as const;

export type LeadType = (typeof LEAD_TYPES)[number]['value'];

export const SOURCES = [
    { value: 'WEB', label: 'Web (directo)' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'OTRO', label: 'Otro' },
] as const;

export type LeadSource = (typeof SOURCES)[number]['value'];

// Embudo de ventas (Módulo de Gestión Comercial).
export const STATUSES = [
    { value: 'NUEVO', label: 'Nuevo' },
    { value: 'EN_ATENCION', label: 'En atención' },
    { value: 'SEGUIMIENTO', label: 'Seguimiento' },
    { value: 'CERRADO', label: 'Cerrado' },
] as const;

export type LeadStatus = (typeof STATUSES)[number]['value'];

export const CLOSED_STATUSES: LeadStatus[] = ['CERRADO'];

export const ACTIVITY_TYPES = [
    { value: 'NOTA', label: 'Nota' },
    { value: 'LLAMADA', label: 'Llamada' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'EMAIL', label: 'Correo enviado' },
    { value: 'REUNION', label: 'Reunión' },
] as const;

// Listas planas de valores, útiles para validación (zod) y para iterar en UI.
export const LEAD_TYPE_VALUES = LEAD_TYPES.map((t) => t.value) as [string, ...string[]];
export const SOURCE_VALUES = SOURCES.map((s) => s.value) as [string, ...string[]];
export const STATUS_VALUES = STATUSES.map((s) => s.value) as [string, ...string[]];
export const ACTIVITY_TYPE_VALUES = ACTIVITY_TYPES.map((a) => a.value) as [string, ...string[]];

// Tipos de entrada de bitácora generados por el propio sistema (no seleccionables por el usuario).
export const SYSTEM_ACTIVITY_TYPES = {
    CREACION: 'CREACION',
    CAMBIO_ESTADO: 'CAMBIO_ESTADO',
    ASIGNACION: 'ASIGNACION',
} as const;

export const ROLES = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'COMERCIAL', label: 'Comercial' },
] as const;

export function leadTypeLabel(value: string): string {
    return LEAD_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function sourceLabel(value: string): string {
    return SOURCES.find((s) => s.value === value)?.label ?? value;
}

export function statusLabel(value: string): string {
    return STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function activityTypeLabel(value: string): string {
    return ACTIVITY_TYPES.find((a) => a.value === value)?.label ?? value;
}

export function roleLabel(value: string): string {
    return ROLES.find((r) => r.value === value)?.label ?? value;
}

// Módulo de Certificados: el estado (Vigente/Vencido) nunca se guarda en la
// BD — se deriva de expiryDate en el momento de la consulta, tanto en el
// CRM como en el validador público, para que nunca quede desactualizado.
export type CertificateStatus = 'VIGENTE' | 'VENCIDO' | 'SIN_VENCIMIENTO';

export function certificateStatus(expiryDate: Date | null): CertificateStatus {
    if (!expiryDate) return 'SIN_VENCIMIENTO';
    return expiryDate.getTime() >= Date.now() ? 'VIGENTE' : 'VENCIDO';
}

export function certificateStatusLabel(status: CertificateStatus): string {
    switch (status) {
        case 'VIGENTE':
            return 'Vigente';
        case 'VENCIDO':
            return 'Vencido';
        default:
            return 'Sin vencimiento';
    }
}

/** Formatea una duración en milisegundos como texto legible corto, ej. "2h 15min" o "3 días". */
export function formatDuration(ms: number): string {
    if (ms < 0) ms = 0;
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return '<1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    if (hours < 24) return remMinutes > 0 ? `${hours}h ${remMinutes}min` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days} día${days === 1 ? '' : 's'}`;
}
