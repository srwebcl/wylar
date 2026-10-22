'use client';

import { useEffect, useLayoutEffect, useState, type RefObject, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** El panel vive en un portal (fuera del DOM del trigger), así que el
 * clásico `containerRef.contains(e.target)` no alcanza para detectar
 * "click afuera" — hay que excluir también clicks dentro del panel. */
export function isOutsideFloatingPanel(target: Node, containerEl: HTMLElement | null): boolean {
    if (containerEl?.contains(target)) return false;
    return !(target instanceof HTMLElement && target.closest('[data-floating-panel]'));
}

/**
 * Renderiza `children` en un portal a document.body, posicionado bajo
 * `anchorRef` con position:fixed. Necesario porque `.glass-card` usa
 * backdrop-blur, que crea su propio contexto de apilamiento — cualquier
 * dropdown (Combobox, Select, filtro de columna) anidado dentro de una
 * tarjeta queda "atrapado" ahí y no puede superponerse a la siguiente
 * tarjeta/fila por más z-index que tenga, sin importar el DOM order.
 */
export function FloatingPanel({
    anchorRef,
    open,
    children,
    align = 'left',
    matchWidth = false,
}: {
    anchorRef: RefObject<HTMLElement | null>;
    open: boolean;
    children: ReactNode;
    align?: 'left' | 'right';
    matchWidth?: boolean;
}) {
    const [rect, setRect] = useState<{ top: number; left: number; right: number; width: number } | null>(null);

    useLayoutEffect(() => {
        if (!open || !anchorRef.current) return;

        function reposition() {
            const r = anchorRef.current!.getBoundingClientRect();
            setRect({ top: r.bottom + 6, left: r.left, right: window.innerWidth - r.right, width: r.width });
        }
        reposition();

        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [open, anchorRef]);

    useEffect(() => {
        if (!open) setRect(null);
    }, [open]);

    if (!open || !rect || typeof document === 'undefined') return null;

    return createPortal(
        <div
            data-floating-panel=""
            style={{
                position: 'fixed',
                top: rect.top,
                left: align === 'left' ? rect.left : undefined,
                right: align === 'right' ? rect.right : undefined,
                width: matchWidth ? rect.width : undefined,
            }}
            className="z-[100]"
        >
            {children}
        </div>,
        document.body,
    );
}
