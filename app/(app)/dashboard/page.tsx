import { prisma } from '@/lib/prisma';
import { STATUSES, SOURCES, formatDuration, certificateStatus } from '@/lib/constants';
import { DashboardCharts } from '@/components/DashboardCharts';

export default async function DashboardPage() {
    const [leads, certificates, activeProfiles] = await Promise.all([
        prisma.lead.findMany({ include: { assignedTo: true } }),
        prisma.certificate.findMany({ select: { expiryDate: true } }),
        prisma.profile.count({ where: { active: true } }),
    ]);

    const totalLeads = leads.length;
    const closedLeads = leads.filter((l) => l.status === 'CERRADO').length;
    const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

    const attended = leads.filter((l) => l.firstAttendedAt);
    const avgResponseMs = attended.length
        ? attended.reduce((sum, l) => sum + (l.firstAttendedAt!.getTime() - l.createdAt.getTime()), 0) / attended.length
        : null;

    const vigentes = certificates.filter((c) => certificateStatus(c.expiryDate) !== 'VENCIDO').length;

    const byStatus = STATUSES.map((s) => ({ name: s.label, value: leads.filter((l) => l.status === s.value).length }));
    const bySource = SOURCES.map((s) => ({ name: s.label, value: leads.filter((l) => l.source === s.value).length })).filter((s) => s.value > 0);

    const byDay = last30DaysSeries(leads.map((l) => l.createdAt));

    const byAssignee = new Map<string, number>();
    for (const lead of leads) {
        const key = lead.assignedTo?.name ?? 'Sin asignar';
        byAssignee.set(key, (byAssignee.get(key) ?? 0) + 1);
    }
    const workload = [...byAssignee.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

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
                    certificatesVigentes: vigentes,
                    certificatesTotal: certificates.length,
                }}
                byStatus={byStatus}
                bySource={bySource}
                byDay={byDay}
                workload={workload}
            />
        </div>
    );
}

function last30DaysSeries(dates: Date[]): { name: string; value: number }[] {
    const days: { key: string; name: string; value: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days.push({ key, name: d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }), value: 0 });
    }
    const byKey = new Map(days.map((d) => [d.key, d]));
    for (const date of dates) {
        const key = date.toISOString().slice(0, 10);
        const day = byKey.get(key);
        if (day) day.value += 1;
    }
    return days.map(({ name, value }) => ({ name, value }));
}
