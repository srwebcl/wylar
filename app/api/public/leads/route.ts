import { createLeadFromPublicForm } from '@/actions/leads';

// Módulo de Captura de Oportunidades: endpoint público (sin sesión) que
// consumen los formularios de wylar.cl (ContactForm, y los formularios de
// cada ficha de certificación) para crear el lead automáticamente — sin
// digitación manual del equipo comercial. Ver README.md, sección
// "Conectar wylar.cl", para el snippet que usa el sitio.

function allowedOrigins(): string[] {
    return (process.env.PUBLIC_FORM_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
}

function corsHeaders(origin: string | null): HeadersInit {
    const allowed = allowedOrigins();
    const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0] || '';
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
    };
}

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: Request) {
    const origin = request.headers.get('origin');
    const headers = corsHeaders(origin);

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ ok: false, error: 'JSON inválido.' }, { status: 400, headers });
    }

    const referer = request.headers.get('referer');
    const result = await createLeadFromPublicForm(body, referer);

    if (!result.ok) {
        return Response.json({ ok: false, error: result.error }, { status: 400, headers });
    }
    return Response.json({ ok: true, code: result.code }, { status: 201, headers });
}
