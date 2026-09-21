'use server';

import { put } from '@vercel/blob';
import { requireUser } from '@/lib/auth';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export interface UploadImageResult {
    url?: string;
    error?: string;
}

/** Sube una imagen de perfil del catálogo a Vercel Blob y devuelve su URL pública. */
export async function uploadProfileImage(formData: FormData): Promise<UploadImageResult> {
    await requireUser();

    const file = formData.get('file');
    if (!(file instanceof File)) {
        return { error: 'No se recibió ningún archivo.' };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { error: 'Formato no soportado. Usa JPG, PNG, WEBP o AVIF.' };
    }
    if (file.size > MAX_BYTES) {
        return { error: 'La imagen pesa más de 5MB. Comprímela e intenta de nuevo.' };
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `catalogo/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    try {
        const blob = await put(filename, file, { access: 'public' });
        return { url: blob.url };
    } catch {
        return { error: 'No se pudo subir la imagen. Intenta de nuevo.' };
    }
}
