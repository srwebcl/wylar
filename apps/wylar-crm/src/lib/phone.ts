const CHILE_MOBILE_RE = /^\+56 9 \d{4} \d{4}$/;

/** True si el valor ya está en el formato canónico exigido: "+56 9 XXXX XXXX". */
export function isValidChileanMobile(value: string): boolean {
    return CHILE_MOBILE_RE.test(value.trim());
}

/**
 * Normaliza cualquier forma en que alguien escriba un celular chileno
 * ("912345678", "+56 9 1234-5678", "56912345678", "1234 5678", etc.) al
 * formato canónico "+56 9 XXXX XXXX". Devuelve null si no se puede
 * interpretar como un celular chileno válido (9 dígitos, empieza con 9).
 */
export function formatChileanMobile(raw: string): string | null {
    let digits = raw.replace(/\D/g, '');

    if (digits.startsWith('56')) digits = digits.slice(2);
    if (digits.length === 8) digits = `9${digits}`;

    if (digits.length !== 9 || !digits.startsWith('9')) return null;

    const subscriber = digits.slice(1);
    return `+56 9 ${subscriber.slice(0, 4)} ${subscriber.slice(4)}`;
}
