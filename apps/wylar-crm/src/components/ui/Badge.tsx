import type { ReactNode } from 'react';

export type BadgeTone = 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate' | 'indigo';

const TONE_CLASSES: Record<BadgeTone, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

/** Pill de estado reutilizable — reemplaza los mapas de color inline
 * repetidos en cada tabla (STATUS_BADGE, STATUS_TONE, etc.). */
export function Badge({ tone = 'slate', children }: { tone?: BadgeTone; children: ReactNode }) {
    return <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${TONE_CLASSES[tone]}`}>{children}</span>;
}
