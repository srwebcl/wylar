import { prisma } from '@/lib/prisma';
import { averageResponseMs, closedThisMonth } from '@/lib/stats';
import { KanbanBoard } from '@/components/KanbanBoard';
import { StatsStrip, type BoardStats } from '@/components/StatsStrip';

// Tablero en vivo detrás de login: nunca debe prerenderizarse. Al ser la ruta
// raíz ("/"), Next intenta analizarla como candidata a estática durante el
// build aunque las demás rutas (todas ƒ igual, sin esta marca) no lo sufren
// — sin DATABASE_URL en el entorno de build (como el CI de GitHub Actions,
// que no tiene ni necesita la base de datos) esa consulta se cuelga sin
// límite y hace fallar el build entero. Con force-dynamic, Next ni lo intenta.
export const dynamic = 'force-dynamic';

// Los leads abiertos se muestran siempre; los cerrados solo los últimos 90 días
// (el resto sigue disponible en Prospectos), así el tablero no crece sin límite.
const CLOSED_VISIBLE_DAYS = 90;

export default async function BoardPage() {
    const since = new Date(Date.now() - CLOSED_VISIBLE_DAYS * 86_400_000);

    const [leads, total, nuevosSinAtender, avgResponse, cerradosEsteMes] = await Promise.all([
        prisma.lead.findMany({
            where: { OR: [{ status: { not: 'CERRADO' } }, { closedAt: { gte: since } }, { closedAt: null }] },
            include: { assignedTo: { omit: { passwordHash: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.lead.count({ where: { status: { not: 'CERRADO' } } }),
        prisma.lead.count({ where: { status: 'NUEVO', firstAttendedAt: null } }),
        averageResponseMs(),
        closedThisMonth(),
    ]);

    const stats: BoardStats = { total, nuevosSinAtender, avgResponseMs: avgResponse, cerradosEsteMes };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Tablero de estados</h1>
                <p className="text-slate-500 text-sm mt-1">Embudo de ventas — arrastra una tarjeta para cambiar su etapa. Los cerrados se muestran los últimos {CLOSED_VISIBLE_DAYS} días.</p>
            </div>

            <StatsStrip stats={stats} />

            <KanbanBoard leads={leads} />
        </div>
    );
}
