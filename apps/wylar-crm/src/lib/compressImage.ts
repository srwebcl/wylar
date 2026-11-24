// Redimensiona y recomprime una imagen en el navegador antes de subirla:
// una foto de cámara de varios MB se reduce a un WebP liviano sin que se note
// la diferencia visual, bajando el peso en Blob storage y el tiempo de carga
// en el sitio público.
export async function compressImageFile(
    file: File,
    { maxDimension = 1920, quality = 0.85 }: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        return file;
    }

    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        bitmap.close();
        return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], newName, { type: 'image/webp' });
}
