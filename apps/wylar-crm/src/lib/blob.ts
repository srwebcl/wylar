import 'server-only';
import { del } from '@vercel/blob';
import { prisma } from './prisma';

const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

/**
 * Borra de Vercel Blob una imagen que ya nadie usa (al reemplazarla o al eliminar
 * el perfil/banner), para no acumular archivos huérfanos. Solo toca URLs de Blob y
 * solo si ningún otro perfil o banner sigue apuntando a la misma imagen.
 */
export async function deleteBlobIfUnused(url: string | null | undefined) {
    if (!url || !BLOB_URL.test(url)) return;
    try {
        const [profiles, slides] = await Promise.all([prisma.profile.count({ where: { image: url } }), prisma.heroSlide.count({ where: { image: url } })]);
        if (profiles + slides > 0) return;
        await del(url);
    } catch (error) {
        console.error('[blob] no se pudo borrar la imagen sin uso:', url, error);
    }
}
