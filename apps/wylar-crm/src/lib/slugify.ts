/**
 * Genera un slug legible y "seguro para URL" a partir de un texto libre:
 * minúsculas, sin tildes/diacríticos, solo [a-z0-9-], sin guiones dobles
 * ni al inicio/final. Coincide con la validación de profileSchema.slug en
 * src/lib/validation.ts.
 */
export function slugify(input: string): string {
    return input
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // quita tildes/diacríticos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}
