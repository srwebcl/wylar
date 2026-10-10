'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KanbanSquare, ListChecks, Users, LayoutDashboard, BookOpen, ShieldCheck, GalleryHorizontal, ScrollText, Settings, FileBadge } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '@/components/Logo';
import type { SafeUser as User } from '@/lib/safeUser';

const CRM_NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/dashboard', adminOnly: false },
    { href: '/', label: 'Tablero Leads', icon: KanbanSquare, match: (p: string) => p === '/', adminOnly: false },
    { href: '/leads', label: 'Prospectos', icon: ListChecks, match: (p: string) => p.startsWith('/leads'), adminOnly: false },
];

const WEB_NAV_ITEMS = [
    { href: '/hero', label: 'Banners', icon: GalleryHorizontal, match: (p: string) => p.startsWith('/hero'), adminOnly: false },
    { href: '/catalogo', label: 'Catálogo', icon: BookOpen, match: (p: string) => p.startsWith('/catalogo'), adminOnly: false },
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

export function Sidebar({ currentUser }: { currentUser: User }) {
    const pathname = usePathname();

    const renderNavItem = ({ href, label, icon: Icon, match, children }: any) => {
        const active = match(pathname);
        const childActive = children?.some((c: any) => c.match(pathname));
        return (
            <div key={href}>
                <Link
                    href={href}
                    className={clsx(
                        'w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 font-medium group',
                        active ? 'bg-amber-500 text-[#0B1E40] shadow-lg shadow-amber-500/20' : 'text-slate-300 hover:bg-white/10 hover:text-white',
                    )}
                >
                    <Icon size={20} className={clsx('mr-3 transition-colors', active ? 'text-[#0B1E40]' : 'text-slate-400 group-hover:text-cyan-400')} />
                    {label}
                </Link>
                {children && (active || childActive) && (
                    <div className="mt-1 ml-6 pl-3 border-l border-white/10 space-y-1">
                        {children.map(({ href: childHref, label: childLabel, icon: ChildIcon, match: childMatch }: any) => {
                            const isChildActive = childMatch(pathname);
                            return (
                                <Link
                                    key={childHref}
                                    href={childHref}
                                    className={clsx(
                                        'w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium group',
                                        isChildActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white',
                                    )}
                                >
                                    <ChildIcon size={15} className={clsx('mr-2.5 transition-colors', isChildActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400')} />
                                    {childLabel}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-72 bg-[#0B1E40] text-white flex flex-col shadow-2xl z-20 shrink-0 sticky top-0 h-screen overflow-y-auto">
            <div className="p-6 flex items-center justify-center border-b border-white/10 shrink-0">
                <Logo width={150} />
            </div>

            <nav className="flex-1 px-4 py-6 space-y-6">
                <div>
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">CRM</p>
                    <div className="space-y-1">
                        {CRM_NAV_ITEMS.filter((item) => !item.adminOnly || currentUser.role === 'ADMIN').map(renderNavItem)}
                    </div>
                </div>

                <div>
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">WEB</p>
                    <div className="space-y-1">
                        {WEB_NAV_ITEMS.filter((item) => !item.adminOnly || currentUser.role === 'ADMIN').map(renderNavItem)}
                    </div>
                </div>
            </nav>
        </div>
    );
}
