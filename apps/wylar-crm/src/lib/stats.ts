import 'server-only';
import { prisma } from './prisma';

// Las métricas se calculan en la base (COUNT/AVG), no cargando todas las filas
// en memoria. Las fechas se guardan en UTC; los días y meses se interpretan en
// horario de Chile para que "hoy" y "este mes" coincidan con lo que ve el equipo.
const TZ = 'America/Santiago';

/** Tiempo medio (ms) entre el ingreso de un lead y su primera atención, o null si no hay datos. */
export async function averageResponseMs(): Promise<number | null> {
    const rows = await prisma.$queryRaw<{ ms: number | null }[]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("firstAttendedAt" - "createdAt")) * 1000)::float8 AS ms
        FROM leads WHERE "firstAttendedAt" IS NOT NULL`;
    return rows[0]?.ms ?? null;
}

/** Leads cerrados durante el mes calendario actual (horario de Chile). */
export async function closedThisMonth(): Promise<number> {
    const rows = await prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM leads
        WHERE "closedAt" IS NOT NULL
          AND date_trunc('month', ("closedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ})
            = date_trunc('month', now() AT TIME ZONE ${TZ})`;
    return rows[0]?.n ?? 0;
}

/** Leads ingresados por día en los últimos 30 días (horario de Chile), con ceros en los días sin leads. */
export async function leadsLast30Days(): Promise<{ name: string; value: number }[]> {
    const rows = await prisma.$queryRaw<{ d: string; n: number }[]>`
        SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS d, COUNT(*)::int AS n
        FROM leads WHERE "createdAt" >= now() - interval '32 days'
        GROUP BY 1`;
    const counts = new Map(rows.map((r) => [r.d, r.n]));

    const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
    const labelFmt = new Intl.DateTimeFormat('es-CL', { timeZone: TZ, day: '2-digit', month: '2-digit' });
    const days: { name: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86_400_000);
        days.push({ name: labelFmt.format(d), value: counts.get(keyFmt.format(d)) ?? 0 });
    }
    return days;
}
