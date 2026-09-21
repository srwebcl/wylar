// Cliente del Módulo de Catálogo del CRM. Reemplaza a src/data/perfiles.js
// (ahora eliminado) — el sitio es estático, así que este fetch corre en
// BUILD TIME (frontmatter de páginas .astro), no en el navegador. Cada vez
// que se edita el catálogo desde el CRM hay que volver a desplegar el
// sitio para que el cambio se refleje (ver botón "Publicar cambios en
// wylar.cl" en /catalogo del CRM, que dispara justamente ese redeploy).
const CRM_ORIGIN = import.meta.env.PUBLIC_CRM_ORIGIN || 'https://wylar-crm.vercel.app';

async function fetchCatalog() {
    const res = await fetch(`${CRM_ORIGIN}/api/public/catalog`, { next: { revalidate: 0 }, cache: 'no-store' });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'No se pudo cargar el catálogo del CRM.');
    return data.profiles;
}

const TYPE_FROM_TEMPLATE = { CHILEVALORA: 'chilevalora', SOLDADURA: 'soldadura', OPERADORES: 'operadores', ESTANDAR: 'estandar' };

function commonFields(p) {
    return {
        id: p.slug,
        type: TYPE_FROM_TEMPLATE[p.templateType] ?? 'chilevalora',
        title: p.title,
        description: p.description,
        image: p.image,
        category: p.category,
        sector: p.sector,
        subsector: p.subsector,
        nivel: p.nivel,
        vigencia: p.vigencia ?? undefined,
        target: p.target,
        isChileValora: p.isChileValora,
        isFeatured: p.isFeatured,
        link: p.link,
        heroHook: p.heroHook,
        heroParagraphs: p.heroParagraphs,
        heroCta: p.heroCta ?? undefined,
    };
}

// Reconstruye, por plantilla, la misma forma anidada que tenía cada perfil
// en el antiguo src/data/perfiles.js — así las 3 plantillas de ficha
// (FichaChileValora/FichaSoldadura/FichaOperadores.astro) siguen funcionando
// sin cambios, alimentadas ahora por el CRM en vez del archivo local.
function detailFields(p) {
    const byKey = Object.fromEntries(p.sections.map((s) => [s.key, s]));
    const texts = (key) => (byKey[key]?.items ?? []).map((i) => i.text);
    const faq = p.faq;

    if (p.templateType === 'ESTANDAR') {
        // Cada bloque es un único texto en HTML (viene del editor de texto
        // enriquecido del CRM) — FichaEstandar.astro lo renderiza tal cual
        // con set:html, sin listas/tarjetas intermedias.
        return {
            descriptionLong: byKey.descriptionLong?.text ?? '',
            requisitos: byKey.requisitos?.text ?? '',
            queEs: byKey.queEs?.text ?? '',
            quienesPueden: byKey.quienesPueden?.text ?? '',
            queSeEvalua: byKey.queSeEvalua?.text ?? '',
            proceso: byKey.proceso?.text ?? '',
            porQueCertificar: byKey.porQueCertificar?.text ?? '',
            faq,
        };
    }

    if (p.templateType === 'SOLDADURA') {
        return {
            queEs: texts('queEs'),
            procesos: (byKey.procesos?.items ?? []).map((i) => ({ code: i.code, name: i.text })),
            necesitasOtroProceso: byKey.procesos?.note ?? '',
            posiciones: {
                placa: (byKey.posiciones?.items ?? []).filter((i) => i.group === 'placa').map((i) => i.text),
                tuberia: (byKey.posiciones?.items ?? []).filter((i) => i.group === 'tuberia').map((i) => i.text),
                note: byKey.posiciones?.note ?? '',
            },
            materiales: { items: texts('materiales'), note: byKey.materiales?.note ?? '' },
            normas: { title: byKey.normas?.title ?? '', text: byKey.normas?.text ?? '' },
            aMedida: { title: byKey.aMedida?.title ?? '', text: byKey.aMedida?.text ?? '', items: texts('aMedida'), closing: byKey.aMedida?.closing ?? '' },
            incluye: texts('incluye'),
            quienesPueden: (byKey.quienesPueden?.items ?? []).map((i) => ({ title: i.title, text: i.text })),
            proceso: (byKey.proceso?.items ?? []).map((i) => ({ title: i.title, description: i.text })),
            trazabilidad: { title: byKey.trazabilidad?.title ?? '', text: byKey.trazabilidad?.text ?? '', items: texts('trazabilidad'), closing: byKey.trazabilidad?.closing ?? '' },
            faq,
            cierre: { title: byKey.cierre?.title ?? '', items: texts('cierre'), closing: byKey.cierre?.closing ?? '' },
        };
    }

    if (p.templateType === 'OPERADORES') {
        return {
            intro: { title: byKey.intro?.title ?? '', text: byKey.intro?.text ?? '' },
            necesitasOtro: byKey.necesitasOtro?.text ?? '',
            aMedida: { title: byKey.aMedida?.title ?? '', text: byKey.aMedida?.text ?? '' },
            quienesPueden: (byKey.quienesPueden?.items ?? []).map((i) => ({ title: i.title, text: i.text })),
            proceso: (byKey.proceso?.items ?? []).map((i) => ({ title: i.title, description: i.text })),
            incluye: { intro: byKey.incluye?.intro ?? '', items: texts('incluye'), note: byKey.incluye?.note ?? '' },
            verificables: { title: byKey.verificables?.title ?? '', text: byKey.verificables?.text ?? '' },
            porQueCertificar: { intro: byKey.porQueCertificar?.intro ?? '', items: texts('porQueCertificar') },
            oportunidades: (byKey.oportunidades?.items ?? []).map((i) => ({ title: i.title, text: i.text })),
            faq,
            cierre: { title: byKey.cierre?.title ?? '', items: texts('cierre'), closing: byKey.cierre?.closing ?? '' },
        };
    }

    // CHILEVALORA (default)
    return {
        importante: {
            noEsCurso: byKey.importante?.text ?? '',
            tituloIntro: byKey.importante?.intro ?? '',
            tituloBullets: texts('importante'),
            tituloClosing: byKey.importante?.closing ?? '',
        },
        queEs: byKey.queEs?.text ?? '',
        quienesPueden: {
            intro: byKey.quienesPueden?.intro ?? '',
            bullets: texts('quienesPueden'),
            closing: byKey.quienesPueden?.closing ?? '',
        },
        queSeEvaluaIntro: byKey.ucls?.intro ?? '',
        ucls: (byKey.ucls?.items ?? []).map((i) => ({ title: i.title, description: i.text })),
        porQueCertificar: { bullets: texts('porQueCertificar'), closing: byKey.porQueCertificar?.closing ?? '' },
        proceso: (byKey.proceso?.items ?? []).map((i) => ({ title: i.title, description: i.text })),
        faq,
        cierre: { title: byKey.cierre?.title ?? '', paragraphs: texts('cierre'), cta: byKey.cierre?.note ?? '' },
        ...(byKey.alert ? { alert: { title: byKey.alert.title, description: byKey.alert.text } } : {}),
    };
}

/** Lista liviana (sin secciones) — usada por CatalogoPerfiles/CatalogoInteractivo/HeroSlider. */
export async function getCatalogList() {
    const profiles = await fetchCatalog();
    return profiles.map(commonFields);
}

/** Perfil completo, en la misma forma que esperan las 3 plantillas de ficha. */
export async function getAllPerfilesDetalle() {
    const profiles = await fetchCatalog();
    return profiles.map((p) => ({ ...commonFields(p), ...detailFields(p) }));
}
