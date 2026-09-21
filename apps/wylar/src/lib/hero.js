// Cliente del Módulo de Hero del CRM. Igual que catalog.js: el sitio es
// estático, este fetch corre en build time. Ver botón "Publicar cambios en
// wylar.cl" en /hero del CRM.
const CRM_ORIGIN = import.meta.env.PUBLIC_CRM_ORIGIN || 'https://wylar-crm.vercel.app';

export async function getHeroSlides() {
    try {
        const res = await fetch(`${CRM_ORIGIN}/api/public/hero-slides`, { next: { revalidate: 0 }, cache: 'no-store' });
        const data = await res.json();
        return data.ok ? data.slides : [];
    } catch {
        return [];
    }
}
