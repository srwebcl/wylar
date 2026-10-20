import { AlarmClock, CheckCircle2, TimerReset, Users } from 'lucide-react';
import { formatDuration } from '@/lib/constants';

export interface BoardStats {
    total: number;
    nuevosSinAtender: number;
    avgResponseMs: number | null;
    cerradosEsteMes: number;
}

export function StatsStrip({ stats }: { stats: BoardStats }) {
    const cards = [
        { label: 'Prospectos activos', value: stats.total, icon: Users, tone: 'text-[#0B1E40] bg-slate-100' },
        { label: 'Nuevos sin atender', value: stats.nuevosSinAtender, icon: AlarmClock, tone: stats.nuevosSinAtender > 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100' },
        { label: 'Tiempo prom. 1ª respuesta', value: stats.avgResponseMs != null ? formatDuration(stats.avgResponseMs) : '—', icon: TimerReset, tone: 'text-cyan-700 bg-cyan-50' },
        { label: 'Cerrados este mes', value: stats.cerradosEsteMes, icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {cards.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="glass-card p-3.5 sm:p-4 flex items-center gap-3">
                    <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
                        <Icon size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">{value}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
