// Validación/formato de RUT chileno, usado por todos los formularios de
// contacto del sitio. El CRM tiene su propia copia en TypeScript
// (wylar-crm/src/lib/rut.ts) — misma lógica, duplicada porque son dos apps
// independientes sin paquete compartido.

/** RUT sin puntos, guion ni espacios y en minúscula (ej. "12.345.678-K" → "12345678k"). */
export function normalizeRut(value) {
    return value.replace(/[.\-\s]/g, '').toLowerCase();
}

/** Valida formato y dígito verificador (módulo 11) de un RUT chileno. */
export function isValidRut(value) {
    const clean = normalizeRut(value);
    if (!/^\d{7,8}[\dk]$/.test(clean)) return false;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += Number(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = 11 - (sum % 11);
    const expectedDv = remainder === 11 ? '0' : remainder === 10 ? 'k' : String(remainder);

    return dv === expectedDv;
}

/** Formatea un RUT ya validado a su forma canónica, ej. "12345678k" → "12.345.678-K". */
export function formatRut(value) {
    const clean = normalizeRut(value);
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();
    const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${withDots}-${dv}`;
}
