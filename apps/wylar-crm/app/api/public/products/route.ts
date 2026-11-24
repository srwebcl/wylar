import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/lib/publicApi';

// Catálogo comercial público (sin precio, sin atributos internos): lo
// consume wylar.cl para poblar el selector obligatorio de "Producto /
// servicio de interés" en sus formularios de contacto. También expone
// profileId, para que la ficha de un perfil resuelva automáticamente qué
// producto le corresponde (ver SidebarForm.astro / ContactModal.astro).
// Ventana amplia a propósito: el plan Free de Neon suspende el cómputo tras
// 5 min de inactividad, así que una caché más corta que eso nunca deja que
// la base llegue a dormir con tráfico normal (ver catalog/route.ts).
const CDN_CACHE = 'public, s-maxage=300, stale-while-revalidate=1800';

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request: Request) {
    const headers = corsHeaders(request.headers.get('origin'));

    const products = await prisma.product.findMany({
        where: { active: true },
        include: { category: true, profile: { select: { slug: true } } },
        orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    const data = products.map((p) => ({
        id: p.id,
        name: p.name,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        profileSlug: p.profile?.slug ?? null,
    }));

    return Response.json({ ok: true, products: data }, { status: 200, headers: { ...headers, 'Cache-Control': CDN_CACHE } });
}
