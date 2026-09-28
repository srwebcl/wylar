/** Solo rutas internas ("/x", no "//host") o https: bloquea javascript:, data:, http:, etc. */
export function isSafeUrl(value: string): boolean {
    if (value.startsWith('/')) return !value.startsWith('//') && !value.startsWith('/\\');
    return /^https:\/\//i.test(value);
}
