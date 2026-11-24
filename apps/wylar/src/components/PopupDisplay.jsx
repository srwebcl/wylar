import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getPopupForPath } from '../lib/popups.js';

// No reaparece en la misma visita (ya cerrado) ni todos los días — se vuelve
// a mostrar como máximo cada 24h en el mismo navegador.
const DISMISS_PREFIX = 'wylar_popup_dismissed_';
const DISMISS_HOURS = 24;
const SHOW_DELAY_MS = 1200;

function isDismissed(id) {
    try {
        const raw = localStorage.getItem(`${DISMISS_PREFIX}${id}`);
        return raw ? Date.now() - Number(raw) < DISMISS_HOURS * 60 * 60 * 1000 : false;
    } catch {
        return false;
    }
}

function markDismissed(id) {
    try {
        localStorage.setItem(`${DISMISS_PREFIX}${id}`, String(Date.now()));
    } catch {
        // Modo privado / storage bloqueado: simplemente puede volver a verse, no es crítico.
    }
}

export default function PopupDisplay() {
    const [popup, setPopup] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getPopupForPath(window.location.pathname).then((data) => {
            if (cancelled || !data || isDismissed(data.id)) return;
            setPopup(data);
            setTimeout(() => {
                if (!cancelled) setVisible(true);
            }, SHOW_DELAY_MS);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    function close() {
        setVisible(false);
        if (popup) markDismissed(popup.id);
    }

    if (!popup || !visible) return null;

    // Sin forzar un tamaño de caja fijo: el <img> conserva su proporción
    // natural (width/height "auto" + object-contain), así nunca se deforma
    // sea cual sea la forma o tamaño que suba el equipo comercial.
    const imageStyle = {
        aspectRatio: popup.imageWidth && popup.imageHeight ? `${popup.imageWidth} / ${popup.imageHeight}` : undefined,
    };
    const imageClass = 'block w-auto h-auto max-w-[88vw] sm:max-w-[480px] max-h-[82vh] object-contain rounded-2xl shadow-2xl';

    const image = <img src={popup.image} alt="" className={imageClass} style={imageStyle} />;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#050B14]/70 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={close}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={close}
                    aria-label="Cerrar"
                    className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white shadow-lg text-slate-600 hover:text-slate-900 flex items-center justify-center z-10 transition-colors"
                >
                    <X size={18} />
                </button>
                {popup.linkHref ? (
                    <a href={popup.linkHref} target={popup.isExternal ? '_blank' : undefined} rel={popup.isExternal ? 'noopener noreferrer' : undefined}>
                        {image}
                    </a>
                ) : (
                    image
                )}
            </div>
        </div>
    );
}
