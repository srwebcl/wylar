'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KanbanSquare, ListChecks, Users, LayoutDashboard, Globe, ShieldCheck, GalleryHorizontal, ScrollText, Settings, FileBadge, Contact, Package, Tags, X, FileSpreadsheet } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '@/components/Logo';
import type { SafeUser as User } from '@/lib/safeUser';

const CRM_NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/dashboard', adminOnly: false },
    { href: '/', label: 'Tablero Oportunidades', icon: KanbanSquare, match: (p: string) => p === '/', adminOnly: false },
    { href: '/leads', label: 'Oportunidades', icon: ListChecks, match: (p: string) => p.startsWith('/leads'), adminOnly: false },
    { href: '/clientes', label: 'Clientes', icon: Contact, match: (p: string) => p.startsWith('/clientes'), adminOnly: false },
    { href: '/cotizaciones', label: 'Cotizaciones', icon: FileSpreadsheet, match: (p: string) => p.startsWith('/cotizaciones'), adminOnly: false },
    {
        href: '/productos',
        label: 'Catálogo',
        icon: Package,
        match: (p: string) => p === '/productos',
        adminOnly: false,
        children: [{ href: '/productos/categorias', label: 'Categorías', icon: Tags, match: (p: string) => p.startsWith('/productos/categorias') }],
    },
];

const WEB_NAV_ITEMS = [
    { href: '/hero', label: 'Banners', icon: GalleryHorizontal, match: (p: string) => p.startsWith('/hero'), adminOnly: false },
    { href: '/catalogo', label: 'Fichas Web', icon: Globe, match: (p: string) => p.startsWith('/catalogo'), adminOnly: false },
    {
        href: '/certificados',
        label: 'Certificados',
        icon: ShieldCheck,
        match: (p: string) => p === '/certificados',
        adminOnly: false,
        children: [
            { href: '/certificados/certificaciones', label: 'Certificaciones', icon: FileBadge, match: (p: string) => p.startsWith('/certificados/certificaciones') },
            { href: '/certificados/configuracion', label: 'Tipos y categorías', icon: Settings, match: (p: string) => p.startsWith('/certificados/configuracion') },
        ],
    },
    { href: '/equipo', label: 'Equipo', icon: Users, match: (p: string) => p === '/equipo', adminOnly: true },
    { href: '/auditoria', label: 'Auditoría', icon: ScrollText, match: (p: string) => p === '/auditoria', adminOnly: true },
];

export function Sidebar({
    currentUser,
    isOpen = false,
    onClose,
}: {
    currentUser: User;
    isOpen?: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();

    const renderNavItem = ({ href, label, icon: Icon, match, children }: any) => {
        const active = match(pathname);
        const childActive = children?.some((c: any) => c.match(pathname));
        return (
            <div key={href}>
                <Link
                    href={href}
                    onClick={onClose}
                    className={clsx(
                        'w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium group text-sm',
                        active ? 'bg-amber-500 text-[#0B1E40] shadow-lg shadow-amber-500/20 font-bold' : 'text-slate-300 hover:bg-white/10 hover:text-white',
                    )}
                >
                    <Icon size={19} className={clsx('mr-3 transition-colors shrink-0', active ? 'text-[#0B1E40]' : 'text-slate-400 group-hover:text-cyan-400')} />
                    <span className="truncate">{label}</span>
                </Link>
                {children && (active || childActive) && (
                    <div className="mt-1 ml-6 pl-3 border-l border-white/10 space-y-1">
                        {children.map(({ href: childHref, label: childLabel, icon: ChildIcon, match: childMatch }: any) => {
                            const isChildActive = childMatch(pathname);
                            return (
                                <Link
                                    key={childHref}
                                    href={childHref}
                                    onClick={onClose}
                                    className={clsx(
                                        'w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-xs font-medium group',
                                        isChildActive ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-white',
                                    )}
                                >
                                    <ChildIcon size={14} className={clsx('mr-2.5 transition-colors shrink-0', isChildActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400')} />
                                    <span className="truncate">{childLabel}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside
            className={clsx(
                'w-72 bg-[#0B1E40] text-white flex flex-col z-40 shrink-0 transition-transform duration-300 ease-in-out',
                // Móvil / tablet (<lg): cajón fijo que vuela sobre el contenido con sombra profunda
                'fixed inset-y-0 left-0 h-full shadow-2xl',
                isOpen ? 'translate-x-0' : '-translate-x-full',
                // Escritorio (>=lg): estático dentro del flex h-screen, siempre altura completa (h-full), borde sutil
                'lg:static lg:h-full lg:translate-x-0 lg:shadow-none lg:border-r lg:border-[#122b59]/60',
            )}
            aria-label="Navegación principal"
        >
            <div className="p-5 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex-1 flex justify-center">
                    <Logo width={140} />
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                    aria-label="Cerrar navegación"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
                <div>
                    <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">CRM</p>
                    <div className="space-y-1">
                        {CRM_NAV_ITEMS.filter((item) => !item.adminOnly || currentUser.role === 'ADMIN').map(renderNavItem)}
                    </div>
                </div>

                <div>
                    <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">WEB</p>
                    <div className="space-y-1">
                        {WEB_NAV_ITEMS.filter((item) => !item.adminOnly || currentUser.role === 'ADMIN').map(renderNavItem)}
                    </div>
                </div>
            </nav>
        </aside>
    );
}
