import { getCatalogList } from '../lib/catalog.js';

// Sitemap dinámico: las páginas fijas más un /perfil/<slug> por cada perfil
// activo del catálogo del CRM (los perfiles nuevos aparecen solos).
export const prerender = false;

const STATIC_PAGES = ['', '/personas', '/empresas', '/otec', '/instituciones', '/catalogo', '/validador', '/chilevalora', '/contacto', '/politicas-privacidad', '/cookies'];

export async function GET({ request }) {
  const siteUrl = new URL(request.url).origin;
  const perfiles = await getCatalogList();
  const urls = [...STATIC_PAGES, ...perfiles.map((p) => `/perfil/${p.id}`)];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <changefreq>${path === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${path === '' ? '1.0' : path.startsWith('/perfil/') ? '0.9' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
