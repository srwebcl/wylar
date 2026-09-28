import { prisma } from '@/lib/prisma';

// Salud del servicio: responde 200 solo si la base de datos contesta (un monitor
// externo puede vigilar esta URL y avisar cuando el CRM o la base caen).
export async function GET() {
    const started = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        return Response.json({ ok: true, service: 'wylar-crm', db: 'ok', ms: Date.now() - started, time: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
        return Response.json({ ok: false, service: 'wylar-crm', db: 'error', time: new Date().toISOString() }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
}
