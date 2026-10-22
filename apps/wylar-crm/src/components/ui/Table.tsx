import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Contenedor + tipografía de celda unificados — se usa junto a <Th> para
 * los encabezados. Mantiene el mismo wrapper `glass-card overflow-hidden`
 * que ya existía, solo lo centraliza. */
export function Table({ children }: { children: ReactNode }) {
    return (
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">{children}</table>
            </div>
        </div>
    );
}

export function Thead({ children }: { children: ReactNode }) {
    return (
        <thead>
            <tr className="bg-slate-50 border-b border-slate-200">{children}</tr>
        </thead>
    );
}

export function Tbody({ children }: { children: ReactNode }) {
    return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Tr({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <tr className={`hover:bg-slate-50/80 transition-colors ${className}`}>{children}</tr>;
}

export function Td({ children, className = '', align = 'left' }: { children: ReactNode; className?: string; align?: 'left' | 'right' }) {
    return <td className={`px-4 py-3 text-slate-700 ${align === 'right' ? 'text-right' : ''} ${className}`}>{children}</td>;
}

/** Fila de "sin resultados" — mismo mensaje y estilo en todas las tablas. */
export function EmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
    return (
        <div className="glass-card p-12 text-center text-slate-500 border border-slate-200/80">
            <Icon size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">{title}</p>
            {hint && <p className="text-sm text-slate-400 mt-1">{hint}</p>}
        </div>
    );
}
