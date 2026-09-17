export async function GET() {
    return Response.json({ ok: true, service: 'wylar-crm', time: new Date().toISOString() });
}
