import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Bloque "Página X de Y / Anterior / Siguiente" — antes copiado y pegado
 * en cada page.tsx que paginaba (solo /leads y /certificados lo tenían). */
export function Pagination({ page, totalPages, buildHref }: { page: number; totalPages: number; buildHref: (page: number) => string }) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm text-slate-600">
            <span>
                Página {Math.min(page, totalPages)} de {totalPages}
            </span>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
                {page > 1 && (
                    <Link href={buildHref(page - 1)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">
                        <ChevronLeft size={16} /> Anterior
                    </Link>
                )}
                {page < totalPages && (
                    <Link href={buildHref(page + 1)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">
                        Siguiente <ChevronRight size={16} />
                    </Link>
                )}
            </div>
        </div>
    );
}

/** Arma el href de una página, preservando los demás query params. */
export function buildPageHref(basePath: string, params: Record<string, string | undefined>, page: number): string {
    const qs = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && k !== 'page') as [string, string][]);
    qs.set('page', String(page));
    return `${basePath}?${qs.toString()}`;
}
