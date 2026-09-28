import 'server-only';
import { prisma } from './prisma';

/**
 * Límite de peticiones por ventana fija, guardado en la base de datos (una sola
 * consulta atómica por chequeo) para que funcione igual entre todas las
 * instancias serverless, sin depender de un servicio externo.
 *
 * Si la base falla, se permite la petición (fail-open): el límite es una
 * protección adicional, no debe tumbar formularios legítimos.
 */
export async function rateLimit(name: string, id: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; retryAfter: number }> {
    const windowMs = windowSeconds * 1000;
    const bucket = Math.floor(Date.now() / windowMs);
    const key = `${name}:${id}:${bucket}`;
    const bucketEnd = (bucket + 1) * windowMs;
    const expiresAt = new Date(bucketEnd + 60_000);

    try {
        const rows = await prisma.$queryRaw<{ count: number }[]>`
            INSERT INTO rate_limits ("key", "count", "expiresAt") VALUES (${key}, 1, ${expiresAt})
            ON CONFLICT ("key") DO UPDATE SET "count" = rate_limits."count" + 1
            RETURNING "count"`;
        const count = Number(rows[0]?.count ?? 1);

        // Limpieza ocasional de contadores vencidos.
        if (Math.random() < 0.02) {
            await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
        }

        return { ok: count <= limit, retryAfter: Math.max(1, Math.ceil((bucketEnd - Date.now()) / 1000)) };
    } catch (error) {
        console.error('[rateLimit] error, se permite la petición:', error);
        return { ok: true, retryAfter: 0 };
    }
}

/** IP del cliente. En Vercel `x-forwarded-for` lo fija la plataforma (no es falsificable desde fuera). */
export function clientIp(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwarded || headers.get('x-real-ip') || 'desconocida';
}

export function tooManyRequests(retryAfter: number, headers: Record<string, string> = {}) {
    return Response.json(
        { ok: false, error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' },
        { status: 429, headers: { ...headers, 'Retry-After': String(retryAfter) } },
    );
}
