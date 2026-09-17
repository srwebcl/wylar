'use client';

import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, TrendingUp, TimerReset, BookOpen, ShieldCheck } from 'lucide-react';

// Dashboard (Módulo de Métricas): gráficos de recharts sobre los datos ya
// calculados en app/(app)/dashboard/page.tsx (server component) — este
// componente solo renderiza, no consulta la BD (recharts necesita correr en
// cliente).

const NAVY = '#0B1E40';
const AMBER = '#f59e0b';
const CYAN = '#0891b2';
const SLATE = '#94a3b8';
const PALETTE = [NAVY, AMBER, CYAN, '#10b981', '#ef4444', SLATE];

interface Kpis {
    totalLeads: number;
    conversionRate: number;
    avgResponseLabel: string;
    activeProfiles: number;
    certificatesVigentes: number;
    certificatesTotal: number;
}

interface Point {
    name: string;
    value: number;
}

export function DashboardCharts({
    kpis,
    byStatus,
    bySource,
    byDay,
    workload,
}: {
    kpis: Kpis;
    byStatus: Point[];
    bySource: Point[];
    byDay: Point[];
    workload: Point[];
}) {
    const kpiCards = [
        { label: 'Prospectos totales', value: kpis.totalLeads, icon: Users, tone: 'text-[#0B1E40] bg-slate-100' },
        { label: 'Tasa de conversión', value: `${kpis.conversionRate}%`, icon: TrendingUp, tone: 'text-emerald-700 bg-emerald-50' },
        { label: 'Tiempo prom. 1ª respuesta', value: kpis.avgResponseLabel, icon: TimerReset, tone: 'text-cyan-700 bg-cyan-50' },
        { label: 'Perfiles activos en catálogo', value: kpis.activeProfiles, icon: BookOpen, tone: 'text-amber-700 bg-amber-50' },
        { label: 'Certificados vigentes', value: `${kpis.certificatesVigentes} / ${kpis.certificatesTotal}`, icon: ShieldCheck, tone: 'text-indigo-700 bg-indigo-50' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiCards.map(({ label, value, icon: Icon, tone }) => (
                    <div key={label} className="glass-card p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
                            <Icon size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-extrabold text-slate-900 leading-none">{value}</p>
                            <p className="text-xs text-slate-500 mt-1">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Leads por estado (embudo)</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={byStatus} layout="vertical" margin={{ left: 16 }}>
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} stroke="#94a3b8" />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                {byStatus.map((_, i) => (
                                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Leads por origen</h3>
                    {bySource.length === 0 ? (
                        <p className="text-slate-400 text-sm py-16 text-center">Aún no hay datos suficientes.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={bySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry) => entry.name}>
                                    {bySource.map((_, i) => (
                                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="font-bold text-slate-900 mb-4">Nuevos prospectos (últimos 30 días)</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={byDay}>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={3} stroke="#94a3b8" />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke={NAVY} fill={NAVY} fillOpacity={0.12} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="font-bold text-slate-900 mb-4">Carga por responsable</h3>
                    {workload.length === 0 ? (
                        <p className="text-slate-400 text-sm py-16 text-center">Aún no hay leads asignados.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={workload}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill={AMBER} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
