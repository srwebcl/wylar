'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import { uploadProfileDocument } from '@/actions/upload';

/** Subida de un PDF (usado hoy para la Ficha Ocupacional del perfil). */
export function DocumentUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFileSelected(file: File | undefined) {
        if (!file) return;
        setError(null);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadProfileDocument(formData);

        setIsUploading(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        if (result.url) onChange(result.url);
    }

    return (
        <div>
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileSelected(e.target.files?.[0])} />

            {value ? (
                <div className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <FileText size={20} className="text-[#0B1E40] shrink-0" />
                    <a href={value} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate flex-1">
                        Ver PDF actual
                    </a>
                    <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-bold text-slate-600 hover:text-[#0B1E40] shrink-0">
                        Cambiar
                    </button>
                    <button type="button" onClick={() => onChange('')} className="text-slate-400 hover:text-red-600 shrink-0">
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0B1E40] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-slate-400 hover:text-[#0B1E40] disabled:opacity-60"
                >
                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    <span className="text-sm font-bold">{isUploading ? 'Subiendo...' : 'Subir PDF'}</span>
                    <span className="text-xs text-slate-400">— máx. 15MB</span>
                </button>
            )}

            {error && <p className="text-xs font-medium text-red-600 mt-2">{error}</p>}
        </div>
    );
}
