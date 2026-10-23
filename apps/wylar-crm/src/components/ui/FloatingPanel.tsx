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
    const [coords, setCoords] = useState<{
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
        width?: number;
        maxHeight?: number;
    } | null>(null);

    useLayoutEffect(() => {
        if (!open || !anchorRef.current) return;

        function reposition() {
            if (!anchorRef.current) return;
            const r = anchorRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - r.bottom;
            const spaceAbove = r.top;

            // Si hay poco espacio abajo (< 230px) y hay más espacio arriba, abrir hacia arriba
            const openUpwards = spaceBelow < 230 && spaceAbove > spaceBelow;

            if (openUpwards) {
                const availableHeight = Math.max(120, Math.min(340, spaceAbove - 16));
                setCoords({
                    bottom: window.innerHeight - r.top + 6,
                    left: align === 'left' ? r.left : undefined,
                    right: align === 'right' ? window.innerWidth - r.right : undefined,
                    width: matchWidth ? r.width : undefined,
                    maxHeight: availableHeight,
                });
            } else {
                const availableHeight = Math.max(120, Math.min(340, spaceBelow - 16));
                setCoords({
                    top: r.bottom + 6,
                    left: align === 'left' ? r.left : undefined,
                    right: align === 'right' ? window.innerWidth - r.right : undefined,
                    width: matchWidth ? r.width : undefined,
                    maxHeight: availableHeight,
                });
            }
        }
        reposition();

        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [open, anchorRef, align, matchWidth]);

    useEffect(() => {
        if (!open) setCoords(null);
    }, [open]);

    if (!open || !coords || typeof document === 'undefined') return null;

    return createPortal(
        <div
            data-floating-panel=""
            style={{
                position: 'fixed',
                top: coords.top,
                bottom: coords.bottom,
                left: coords.left,
                right: coords.right,
                width: coords.width,
                maxHeight: coords.maxHeight,
            }}
            className="z-[200] flex flex-col"
        >
            {children}
        </div>,
        document.body,
    );
}
