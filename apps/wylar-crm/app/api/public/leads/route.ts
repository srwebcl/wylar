import { createLeadFromPublicForm } from '@/actions/leads';
import { corsHeaders } from '@/lib/publicApi';

// Módulo de Captura de Oportunidades: endpoint público (sin sesión) que
// consumen los formularios de wylar.cl (ContactForm, y los formularios de
// cada ficha de certificación) para crear el lead automáticamente — sin
// digitación manual del equipo comercial. Ver README.md, sección
// "Conectar wylar.cl", para el snippet que usa el sitio.

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
