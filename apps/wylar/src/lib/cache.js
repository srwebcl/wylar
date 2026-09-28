// Caché de CDN para páginas que dependen del catálogo del CRM. Con esto no hace
// falta reconstruir el sitio al editar el catálogo: la página se sirve desde el
// CDN hasta 60 s y luego se refresca en segundo plano (hasta 5 min más de gracia).
// Si el catálogo vino vacío (CRM caído), no se cachea para no fijar el error.
export function setCdnCache(Astro, hasData = true) {
    Astro.response.headers.set('Cache-Control', hasData ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store');
}
