import 'server-only';
import { del } from '@vercel/blob';
import { prisma } from './prisma';

const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

/**
 * Borra de Vercel Blob un archivo (imagen o PDF) que ya nadie usa (al
 * reemplazarlo o al eliminar el perfil/banner), para no acumular archivos
 * huérfanos. Solo toca URLs de Blob y solo si ningún otro perfil o banner
 * sigue apuntando al mismo archivo — se revisan todos los campos que pueden
 * guardar una URL de Blob (image, cardImage, fichaUrl) para no borrar algo
 * que sigue en uso bajo un campo distinto al que se está reemplazando.
 */
export async function deleteBlobIfUnused(url: string | null | undefined) {
    if (!url || !BLOB_URL.test(url)) return;
    try {
        const [profiles, slides] = await Promise.all([
            prisma.profile.count({ where: { OR: [{ image: url }, { cardImage: url }, { fichaUrl: url }] } }),
            prisma.heroSlide.count({ where: { image: url } }),
        ]);
        if (profiles + slides > 0) return;
        await del(url);
    } catch (error) {
        console.error('[blob] no se pudo borrar el archivo sin uso:', url, error);
    }
}
