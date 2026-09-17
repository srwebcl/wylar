import 'server-only';
import { SOURCE_VALUES } from './constants';

/**
 * Normaliza/valida el canal de origen de un lead (Rastreo de Origen).
 *
 * El sitio wylar.cl ya calcula `source` en el propio formulario a partir de
 * `document.referrer` y los parámetros `utm_source`/`utm_medium` de la URL
 * (ver el snippet de ejemplo en README.md, sección "Conectar wylar.cl").
 * Esta función es la segunda barrera del lado del servidor: si el valor
 * recibido no es uno de los canales conocidos, lo re-detecta a partir del
 * header `Referer` de la propia request, y si tampoco hay pistas, cae a "OTRO".
 */
export function resolveSource(clientSource: string | undefined | null, refererHeader: string | null): string {
    if (clientSource && (SOURCE_VALUES as readonly string[]).includes(clientSource)) {
        return clientSource;
    }
    return detectSourceFromReferer(refererHeader);
}

export function detectSourceFromReferer(referer: string | null): string {
    if (!referer) return 'OTRO';
    const host = safeHostname(referer);
    if (!host) return 'OTRO';
    if (host.includes('facebook.com') || host.includes('fb.com')) return 'FACEBOOK';
    if (host.includes('instagram.com') || host.includes('l.instagram.com')) return 'INSTAGRAM';
    if (host.includes('whatsapp.com') || host.includes('wa.me')) return 'WHATSAPP';
    if (host.includes('wylar.cl') || host.includes('localhost')) return 'WEB';
    return 'OTRO';
}

function safeHostname(url: string): string | null {
    try {
        return new URL(url).hostname.toLowerCase();
    } catch {
        return null;
    }
}
