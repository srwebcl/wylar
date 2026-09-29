// Dinámico (no un archivo estático en public/) para que el Sitemap: siempre
// apunte al dominio real que sirvió la petición (wylar.cl, www.wylar.cl, o el
// *.vercel.app de respaldo) en vez de quedar fijo al dominio usado en el build.
export const prerender = false;

export async function GET({ request }) {
    const siteUrl = new URL(request.url).origin;
    const body = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
