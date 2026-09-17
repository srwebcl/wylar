// Cliente del Módulo de Hero del CRM. Igual que catalog.js: el sitio es
// estático, este fetch corre en build time. Ver botón "Publicar cambios en
// wylar.cl" en /hero del CRM.
const CRM_ORIGIN = import.meta.env.PUBLIC_CRM_ORIGIN || 'https://wylar-crm.vercel.app';

let cachedSlides = null;

export async function getHeroSlides() {
    if (cachedSlides) return cachedSlides;
    try {
        const res = await fetch(`${CRM_ORIGIN}/api/public/hero-slides`);
        const data = await res.json();
        cachedSlides = data.ok ? data.slides : [];
    } catch {
        // Si el CRM no responde durante el build, el sitio no debe romperse:
        // HeroSlider.jsx ya trae su propio slide de respaldo (FALLBACK_SLIDE).
        cachedSlides = [];
    }
    return cachedSlides;
}
