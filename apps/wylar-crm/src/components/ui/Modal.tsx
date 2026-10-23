'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Shell de modal compartido (backdrop + tarjeta + cierre con Escape/click
 * fuera). Renderiza en document.body mediante portal para evitar que el
 * stacking context del AppShell o Sidebar (z-40) lo solape. */
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className={`glass-card bg-white w-full ${maxWidth} max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150`}>
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>
                    <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body,
    );
}
