export async function GET({ request }) {
  const siteUrl = new URL(request.url).origin;
  
  // Lista de todas las rutas estáticas del sitio web
  const pages = [
    '',
    '/empresas',
    '/personas',
    '/instituciones',
    '/catalogo',
    '/chilevalora',
    '/perfil/electricista',
    '/politicas-privacidad',
    '/cookies'
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
  <url>
    <loc>${siteUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>
  `).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
