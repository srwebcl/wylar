'use client';

import { useState, useTransition } from 'react';
import { UploadCloud, Check, X } from 'lucide-react';
import { triggerSitePublish } from '@/actions/publish';

/**
 * Botón compartido por Catálogo y Hero: el sitio wylar.cl es estático, así
 * que un cambio guardado acá no se ve reflejado hasta que se vuelve a
 * construir. Este botón dispara ese redeploy (Deploy Hook de Vercel) sin
 * que el equipo tenga que tocar nada técnico.
 */
export function PublishSiteButton() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

    function handleClick() {
        setResult(null);
        startTransition(async () => {
            const res = await triggerSitePublish();
            setResult(res.error ? { ok: false, message: res.error } : { ok: true, message: res.success ?? 'Publicado.' });
        });
    }

    return (
        <div className="flex flex-col items-end gap-1.5">
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                className="flex items-center gap-2 bg-white border-2 border-[#0B1E40] text-[#0B1E40] hover:bg-[#0B1E40] hover:text-white font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                title="wylar.cl es un sitio estático: los cambios de acá no se ven hasta publicar"
            >
                <UploadCloud size={18} className={isPending ? 'animate-pulse' : ''} />
                {isPending ? 'Publicando...' : 'Publicar cambios en wylar.cl'}
            </button>
            {result && (
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.ok ? <Check size={14} /> : <X size={14} />} {result.message}
                </span>
            )}
        </div>
    );
}
