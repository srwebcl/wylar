'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Shell de modal compartido (backdrop + tarjeta + cierre con Escape/click
 * fuera) — reemplaza el bloque `fixed inset-0 z-50...` que antes se
 * duplicaba en cada tabla con un modal propio. */
export function Modal({
    open,
    onClose,
    title,
    children,
    maxWidth = 'max-w-xl',
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}) {
    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className={`glass-card bg-white w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-6 space-y-4`}>
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">{title}</h2>
                    <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
