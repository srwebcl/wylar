'use server';

import { requireUser } from '@/lib/auth';

export interface PublishState {
    error?: string;
    success?: string;
}

/**
 * Dispara un redeploy del sitio wylar.cl (proyecto "wylar" en Vercel) vía su
 * Deploy Hook. El sitio es 100% estático — cuando se edita el Catálogo o el
 * Hero desde este CRM, el cambio no aparece en wylar.cl hasta que el sitio
 * se vuelve a construir, porque esos datos se leen en build time (ver
 * apps/wylar/src/lib/catalog.js y hero.js). Este botón es ese "publicar".
 */
export async function triggerSitePublish(): Promise<PublishState> {
    await requireUser();

    const hookUrl = process.env.SITE_DEPLOY_HOOK_URL;
    if (!hookUrl) {
        return { error: 'Falta configurar SITE_DEPLOY_HOOK_URL en las variables de entorno del CRM.' };
    }

    try {
        const res = await fetch(hookUrl, { method: 'POST' });
        if (!res.ok) {
            return { error: `Vercel respondió con error (${res.status}) al intentar publicar el sitio.` };
        }
    } catch {
        return { error: 'No se pudo contactar a Vercel para publicar el sitio.' };
    }

    return { success: 'Publicación en camino — wylar.cl se actualiza en ~1 minuto.' };
}
