'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadProfileImage } from '@/actions/upload';

export function ImageUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFileSelected(file: File | undefined) {
        if (!file) return;
        setError(null);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadProfileImage(formData);

        setIsUploading(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        if (result.url) onChange(result.url);
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
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={value} alt="" className="w-full h-full object-cover" />
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
                            onClick={() => onChange('')}
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
                    <span className="text-xs text-slate-400">JPG, PNG, WEBP o AVIF — máx. 5MB</span>
                </button>
            )}

            {error && <p className="text-xs font-medium text-red-600 mt-2">{error}</p>}
        </div>
    );
}
