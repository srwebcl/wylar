import { prisma } from '@/lib/prisma';
import { KanbanBoard } from '@/components/KanbanBoard';
import { StatsStrip, type BoardStats } from '@/components/StatsStrip';

export default async function BoardPage() {
    const leads = await prisma.lead.findMany({
        include: { assignedTo: true },
        orderBy: { createdAt: 'desc' },
    });

    const stats = computeStats(leads);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Tablero de estados</h1>
                <p className="text-slate-500 text-sm mt-1">Embudo de ventas — arrastra una tarjeta para cambiar su etapa.</p>
            </div>

            <StatsStrip stats={stats} />

            <KanbanBoard leads={leads} />
        </div>
    );
}

function computeStats(leads: { status: string; createdAt: Date; firstAttendedAt: Date | null; closedAt: Date | null }[]): BoardStats {
    const total = leads.filter((l) => l.status !== 'CERRADO').length;
    const nuevosSinAtender = leads.filter((l) => l.status === 'NUEVO' && !l.firstAttendedAt).length;

    const attended = leads.filter((l) => l.firstAttendedAt);
    const avgResponseMs = attended.length
        ? attended.reduce((sum, l) => sum + (l.firstAttendedAt!.getTime() - l.createdAt.getTime()), 0) / attended.length
        : null;

    const now = new Date();
    const cerradosEsteMes = leads.filter(
        (l) => l.closedAt && l.closedAt.getMonth() === now.getMonth() && l.closedAt.getFullYear() === now.getFullYear(),
    ).length;

    return { total, nuevosSinAtender, avgResponseMs, cerradosEsteMes };
}
