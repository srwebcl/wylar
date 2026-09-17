import 'server-only';

// Helper de CORS compartido por los endpoints públicos que consume wylar.cl
// (app/api/public/*): captura de leads, catálogo y validador de
// certificados. Todos comparten la misma lista de orígenes permitidos
// (PUBLIC_FORM_ORIGINS, ver .env.example).

function allowedOrigins(): string[] {
    return (process.env.PUBLIC_FORM_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
}

export function corsHeaders(origin: string | null): HeadersInit {
    const allowed = allowedOrigins();
    const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0] || '';
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
    };
}
