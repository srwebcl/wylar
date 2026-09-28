import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/lib/publicApi';

// Módulo de Hero: endpoint público (sin sesión) que consume el Home de
// wylar.cl para armar los slides personalizados del hero (ver
// apps/wylar/src/lib/hero.js). Los slides "de perfil destacado" no viven
// acá — el sitio los agrega aparte a partir de GET /api/public/catalog.

// Caché de CDN: la base se consulta como máximo cada ~30 s por región, aunque el
// sitio reciba mucho tráfico; los cambios del CRM se ven en menos de 2.5 minutos.
const CDN_CACHE = 'public, s-maxage=30, stale-while-revalidate=120';

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request: Request) {
    const headers = corsHeaders(request.headers.get('origin'));

    const slides = await prisma.heroSlide.findMany({ where: { active: true }, orderBy: { order: 'asc' } });

    const data = slides.map((s) => ({
        id: String(s.id),
        image: s.image,
        eyebrowLead: s.eyebrowLead,
        eyebrowAccent: s.eyebrowAccent,
        title: s.title,
        titleHighlight: s.titleHighlight,
        description: s.description,
        ctaLabel: s.ctaLabel,
        ctaHref: s.ctaHref,
    }));

    return Response.json({ ok: true, slides: data }, { status: 200, headers: { ...headers, 'Cache-Control': CDN_CACHE } });
}
