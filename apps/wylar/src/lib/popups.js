// Cliente del Módulo de Pop-ups del CRM.
const CRM_ORIGIN = import.meta.env.PUBLIC_CRM_ORIGIN || 'https://wylar-crm.vercel.app';

/** Pop-up aplicable a `path` (si hay alguno activo y vigente para esa página), o null. */
export async function getPopupForPath(path) {
    try {
        const res = await fetch(`${CRM_ORIGIN}/api/public/popups?page=${encodeURIComponent(path)}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(4000),
        });
        const data = await res.json();
        return data.ok ? data.popup : null;
    } catch {
        return null;
    }
}
