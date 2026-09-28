/** RUT sin puntos, guion ni espacios y en minúscula (ej. "12.345.678-K" → "12345678k"). */
export function normalizeRut(value: string): string {
    return value.replace(/[.\-\s]/g, '').toLowerCase();
}
