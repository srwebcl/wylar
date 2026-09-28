import { prisma } from '@/lib/prisma';
import { STATUSES, SOURCES, formatDuration } from '@/lib/constants';
import { averageResponseMs, leadsLast30Days } from '@/lib/stats';
import { DashboardCharts } from '@/components/DashboardCharts';

export default async function DashboardPage() {
    const now = new Date();
    const [statusRows, sourceRows, assigneeRows, users, avgResponseMs, byDay, certificatesTotal, certificatesVigentes, activeProfiles] = await Promise.all([
        prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.lead.groupBy({ by: ['source'], _count: { _all: true } }),
        prisma.lead.groupBy({ by: ['assignedToId'], _count: { _all: true } }),
        prisma.user.findMany({ select: { id: true, name: true } }),
        averageResponseMs(),
        leadsLast30Days(),
        prisma.certificate.count(),
        // Vigente = no revocado y (sin vencimiento o aún no vence).
        prisma.certificate.count({ where: { revokedAt: null, OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] } }),
        prisma.profile.count({ where: { active: true } }),
    ]);

    const byStatusMap = new Map<string, number>(statusRows.map((r) => [r.status, r._count._all]));
    const bySourceMap = new Map<string, number>(sourceRows.map((r) => [r.source, r._count._all]));

    const totalLeads = statusRows.reduce((sum, r) => sum + r._count._all, 0);
    const closedLeads = byStatusMap.get('CERRADO') ?? 0;
    const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

    const byStatus = STATUSES.map((s) => ({ name: s.label, value: byStatusMap.get(s.value) ?? 0 }));
    const bySource = SOURCES.map((s) => ({ name: s.label, value: bySourceMap.get(s.value) ?? 0 })).filter((s) => s.value > 0);

    const userNames = new Map(users.map((u) => [u.id, u.name]));
    const workload = assigneeRows
        .map((r) => ({ name: r.assignedToId != null ? (userNames.get(r.assignedToId) ?? 'Usuario eliminado') : 'Sin asignar', value: r._count._all }))
        .sort((a, b) => b.value - a.value);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 text-sm mt-1">Resumen general del CRM — leads, embudo, catálogo y certificados.</p>
            </div>

            <DashboardCharts
                kpis={{
                    totalLeads,
                    conversionRate,
                    avgResponseLabel: avgResponseMs != null ? formatDuration(avgResponseMs) : '—',
                    activeProfiles,
                    certificatesVigentes,
                    certificatesTotal,
                }}
                byStatus={byStatus}
                bySource={bySource}
                byDay={byDay}
                workload={workload}
            />
        </div>
    );
}
