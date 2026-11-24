'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadPopupImage } from '@/actions/upload';
import { compressImageFile } from '@/lib/compressImage';

/** Igual que ImageUploadField, pero además captura el ancho/alto natural de
 * la imagen (leyéndola en el navegador) — el sitio los usa para armar el
 * modal con el aspect-ratio real en vez de recortar o deformar la imagen. */
export function PopupImageUploadField({
    value,
    onChange,
}: {
    value: string;
    onChange: (url: string, width: number | null, height: number | null) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function readDimensions(url: string): Promise<{ width: number | null; height: number | null }> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null });
            img.onerror = () => resolve({ width: null, height: null });
            img.src = url;
        });
    }

    async function handleFileSelected(file: File | undefined) {
        if (!file) return;
        setError(null);
        setIsUploading(true);

        const compressed = await compressImageFile(file, { maxDimension: 1400 });
        const formData = new FormData();
        formData.append('file', compressed);
        const result = await uploadPopupImage(formData);

        if (result.error) {
            setIsUploading(false);
            setError(result.error);
            return;
        }
        if (result.url) {
            const { width, height } = await readDimensions(result.url);
            setIsUploading(false);
            onChange(result.url, width, height);
        } else {
            setIsUploading(false);
        }
    }

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />

            {value ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group flex items-center justify-center">
                    <img src={value} alt="" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="bg-white text-slate-900 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5"
                        >
                            <ImagePlus size={14} /> Cambiar
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange('', null, null)}
                            className="bg-white text-red-600 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5"
                        >
                            <X size={14} /> Quitar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-44 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0B1E40] hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#0B1E40] disabled:opacity-60"
                >
                    {isUploading ? <Loader2 size={28} className="animate-spin" /> : <ImagePlus size={28} />}
                    <span className="text-sm font-bold">{isUploading ? 'Subiendo...' : 'Subir imagen'}</span>
                    <span className="text-xs text-slate-400">JPG, PNG, WEBP o AVIF — máx. 5MB. Cualquier forma o tamaño: se adapta sola en el sitio.</span>
                </button>
            )}

            {error && <p className="text-xs font-medium text-red-600 mt-2">{error}</p>}
        </div>
    );
}
