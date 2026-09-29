'use server';

import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { requireUser } from '@/lib/auth';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

// El tipo que declara el navegador (file.type) lo controla quien sube el archivo:
// se verifica además la firma real de los primeros bytes y la extensión sale de ahí.
function detectImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
    const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
    if (startsWith([0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' };
    if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', ext: 'png' };
    if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return { mime: 'image/webp', ext: 'webp' };
    if (startsWith([0x66, 0x74, 0x79, 0x70], 4) && ['avif', 'avis'].includes(String.fromCharCode(...bytes.slice(8, 12)))) return { mime: 'image/avif', ext: 'avif' };
    return null;
}

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

    const detected = detectImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
    if (!detected || !ALLOWED_TYPES.includes(detected.mime)) {
        return { error: 'El archivo no es una imagen válida (JPG, PNG, WEBP o AVIF).' };
    }

    const filename = `catalogo/${Date.now()}-${randomUUID().slice(0, 8)}.${detected.ext}`;

    try {
        const blob = await put(filename, file, { access: 'public', contentType: detected.mime });
        return { url: blob.url };
    } catch {
        return { error: 'No se pudo subir la imagen. Intenta de nuevo.' };
    }
}

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB

// Firma real de un PDF: siempre empieza con "%PDF-" (0x25 0x50 0x44 0x46 0x2D).
function isPdf(bytes: Uint8Array): boolean {
    const sig = [0x25, 0x50, 0x44, 0x46, 0x2d];
    return sig.every((b, i) => bytes[i] === b);
}

/** Sube la Ficha Ocupacional (PDF) de un perfil del catálogo a Vercel Blob. */
export async function uploadProfileDocument(formData: FormData): Promise<UploadImageResult> {
    await requireUser();

    const file = formData.get('file');
    if (!(file instanceof File)) {
        return { error: 'No se recibió ningún archivo.' };
    }
    if (file.type !== 'application/pdf') {
        return { error: 'El archivo debe ser un PDF.' };
    }
    if (file.size > MAX_PDF_BYTES) {
        return { error: 'El PDF pesa más de 15MB. Comprímelo e intenta de nuevo.' };
    }

    const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (!isPdf(header)) {
        return { error: 'El archivo no es un PDF válido.' };
    }

    const filename = `catalogo/fichas/${Date.now()}-${randomUUID().slice(0, 8)}.pdf`;

    try {
        const blob = await put(filename, file, { access: 'public', contentType: 'application/pdf' });
        return { url: blob.url };
    } catch {
        return { error: 'No se pudo subir el PDF. Intenta de nuevo.' };
    }
}
