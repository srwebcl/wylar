// Cliente del CRM de Wylar (Módulo de Captura de Oportunidades).
//
// Cada formulario del sitio (ContactForm, y el modal/sidebar de las fichas
// de certificación) llama a submitLead() en vez de simular el envío — el
// lead se crea solo en el CRM, sin digitación manual del equipo comercial.
//
// PUBLIC_CRM_API_URL debe apuntar al endpoint público desplegado del
// proyecto wylar-crm (ver wylar-crm/README.md, sección "Conectar wylar.cl").
// Configúrala en un archivo .env de este proyecto:
//   PUBLIC_CRM_API_URL="https://<tu-deploy-de-wylar-crm>.vercel.app/api/public/leads"
export const CRM_API_URL = import.meta.env.PUBLIC_CRM_API_URL || 'https://crm.wylar.cl/api/public/leads';

/**
 * Rastreo de Origen: detecta desde dónde llegó el visitante (Facebook,
 * Instagram, WhatsApp, Web directo, u otro) a partir de utm_source/medium
 * en la URL y, si no hay, del referrer del navegador. El servidor vuelve a
 * validar/normalizar este valor (ver wylar-crm/src/lib/leadSource.ts).
 */
export function detectLeadSource() {
    if (typeof window === 'undefined') return { source: 'WEB', sourceDetail: null };

    const params = new URLSearchParams(window.location.search);
    const utmSource = (params.get('utm_source') || '').toLowerCase();
    const referrer = document.referrer || '';
    let referrerHost = '';
    try {
        referrerHost = referrer ? new URL(referrer).hostname.toLowerCase() : '';
    } catch {
        referrerHost = '';
    }

    let source = 'WEB';
    if (utmSource.includes('facebook') || referrerHost.includes('facebook.com')) source = 'FACEBOOK';
    else if (utmSource.includes('instagram') || referrerHost.includes('instagram.com')) source = 'INSTAGRAM';
    else if (utmSource.includes('whatsapp') || referrerHost.includes('whatsapp.com') || referrerHost.includes('wa.me')) source = 'WHATSAPP';
    else if (utmSource) source = 'OTRO';
    else if (referrerHost && referrerHost !== window.location.hostname) source = 'OTRO';

    const detailParts = [];
    if (referrer) detailParts.push(`referrer: ${referrer}`);
    if (params.toString()) detailParts.push(`utm: ${params.toString()}`);

    return { source, sourceDetail: detailParts.length ? detailParts.join(' | ') : null };
}

/**
 * Envía un lead al CRM. `payload` acepta: type, name, email, phone,
 * company, certificationInterest, message, website (honeypot, dejar vacío).
 * Lanza un Error con un mensaje legible si falla.
 */
export async function submitLead(payload) {
    const { source, sourceDetail } = detectLeadSource();

    let response;
    try {
        response = await fetch(CRM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, source, sourceDetail }),
        });
    } catch {
        throw new Error('No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
        throw new Error(data.error || 'No pudimos enviar tu solicitud. Intenta nuevamente en unos minutos.');
    }
    return data;
}
