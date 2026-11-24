import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/lib/publicApi';

// Módulo de Pop-ups: endpoint público (sin sesión) que consume wylar.cl para
// decidir si corresponde mostrar un pop-up en la página actual (?page=/ruta).
// Si hay más de uno aplicable, se devuelve solo el más reciente — mostrar
// varios pop-ups apilados en la misma visita sería mala UX.

// Ventana amplia a propósito: el plan Free de Neon suspende el cómputo tras
// 5 min de inactividad, así que una caché más corta que eso nunca deja que
// la base llegue a dormir con tráfico normal.
const CDN_CACHE = 'public, s-maxage=300, stale-while-revalidate=1800';

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request: Request) {
    const headers = corsHeaders(request.headers.get('origin'));
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ?? '';
    const isProfilePage = page.startsWith('/perfil/');

    const popup = await prisma.popup.findFirst({
        where: {
            active: true,
            OR: [{ showOnAllPages: true }, { pages: { has: page } }, ...(isProfilePage ? [{ showOnProfilePages: true }] : [])],
        },
        orderBy: { createdAt: 'desc' },
    });

    const data = popup
        ? {
              id: popup.id,
              image: popup.image,
              imageWidth: popup.imageWidth,
              imageHeight: popup.imageHeight,
              linkHref: popup.linkType === 'NONE' ? null : popup.linkHref,
              isExternal: popup.linkType === 'EXTERNAL',
          }
        : null;

    return Response.json({ ok: true, popup: data }, { status: 200, headers: { ...headers, 'Cache-Control': CDN_CACHE } });
}
