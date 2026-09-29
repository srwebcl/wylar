import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/lib/publicApi';

// Módulo de Catálogo: endpoint público (sin sesión) que consume wylar.cl
// para pintar /catalogo y /perfil/[slug], reemplazando lo que hoy tiene
// hardcodeado en su propio src/data/perfiles.js.
//
// Devuelve cada perfil con sus secciones (agrupadas por `key`, en el mismo
// orden en que se definieron) y su FAQ, para que wylar.cl pueda reconstruir
// las mismas plantillas de ficha que ya tiene (FichaChileValora,
// FichaSoldadura, FichaOperadores) alimentadas por esta API en vez del
// archivo local.

// Caché de CDN: la base se consulta como máximo cada ~30 s por región, aunque el
// sitio reciba mucho tráfico; los cambios del CRM se ven en menos de 2.5 minutos.
const CDN_CACHE = 'public, s-maxage=30, stale-while-revalidate=120';

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request: Request) {
    const headers = corsHeaders(request.headers.get('origin'));
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const profiles = await prisma.profile.findMany({
        where: { active: true, ...(slug ? { slug } : {}) },
        orderBy: [{ isFeatured: 'desc' }, { title: 'asc' }],
        include: {
            sections: { orderBy: { order: 'asc' }, include: { items: { orderBy: { order: 'asc' } } } },
            faqs: { orderBy: { order: 'asc' } },
        },
    });

    if (slug && profiles.length === 0) {
        return Response.json({ ok: false, error: 'Perfil no encontrado.' }, { status: 404, headers });
    }

    const data = profiles.map((profile) => ({
        slug: profile.slug,
        templateType: profile.templateType,
        title: profile.title,
        description: profile.description,
        image: profile.image,
        cardImage: profile.cardImage,
        fichaUrl: profile.fichaUrl,
        category: profile.category,
        sector: profile.sector,
        subsector: profile.subsector,
        nivel: profile.nivel,
        vigencia: profile.vigencia,
        target: profile.target,
        isChileValora: profile.isChileValora,
        isFeatured: profile.isFeatured,
        link: `/perfil/${profile.slug}`,
        heroHook: profile.heroHook,
        heroParagraphs: profile.heroParagraphs,
        heroCta: profile.heroCta,
        sections: profile.sections.map((section) => ({
            key: section.key,
            title: section.title,
            text: section.text,
            intro: section.intro,
            closing: section.closing,
            note: section.note,
            items: section.items.map((item) => ({ group: item.group, code: item.code, title: item.title, text: item.text })),
        })),
        faq: profile.faqs.map((faq) => ({ q: faq.question, a: faq.answer })),
    }));

    return Response.json({ ok: true, profiles: slug ? data[0] ? [data[0]] : [] : data }, { status: 200, headers: { ...headers, 'Cache-Control': CDN_CACHE } });
}
