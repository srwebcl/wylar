// Cliente del Módulo de Hero del CRM.
// Este fetch se ejecuta en SSR usando el caché configurado, por lo que los cambios
// del CRM se reflejarán en el sitio tras expirar el caché (1 a 3 minutos).
const CRM_ORIGIN = import.meta.env.PUBLIC_CRM_ORIGIN || 'https://wylar-crm.vercel.app';

export async function getHeroSlides() {
    try {
        const res = await fetch(`${CRM_ORIGIN}/api/public/hero-slides`, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
        const data = await res.json();
        return data.ok ? data.slides : [];
    } catch {
        return [];
    }
}
