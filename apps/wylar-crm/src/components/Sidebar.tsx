'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KanbanSquare, ListChecks, Users, LogOut, LayoutDashboard, BookOpen, ShieldCheck, GalleryHorizontal, KeyRound, ScrollText } from 'lucide-react';
import clsx from 'clsx';
import { logoutAction } from '@/actions/auth';
import { Logo } from '@/components/Logo';
import { roleLabel } from '@/lib/constants';
import type { SafeUser as User } from '@/lib/safeUser';

const CRM_NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/dashboard', adminOnly: false },
    { href: '/', label: 'Tablero Leads', icon: KanbanSquare, match: (p: string) => p === '/', adminOnly: false },
    { href: '/leads', label: 'Prospectos', icon: ListChecks, match: (p: string) => p.startsWith('/leads'), adminOnly: false },
];

const WEB_NAV_ITEMS = [
    { href: '/hero', label: 'Banners', icon: GalleryHorizontal, match: (p: string) => p.startsWith('/hero'), adminOnly: false },
    { href: '/catalogo', label: 'Catálogo', icon: BookOpen, match: (p: string) => p.startsWith('/catalogo'), adminOnly: false },
    { href: '/certificados', label: 'Certificados', icon: ShieldCheck, match: (p: string) => p.startsWith('/certificados'), adminOnly: false },
    { href: '/equipo', label: 'Equipo', icon: Users, match: (p: string) => p === '/equipo', adminOnly: true },
    { href: '/auditoria', label: 'Auditoría', icon: ScrollText, match: (p: string) => p === '/auditoria', adminOnly: true },
];

export function Sidebar({ currentUser }: { currentUser: User }) {
    const pathname = usePathname();

    const renderNavItem = ({ href, label, icon: Icon, match }: any) => {
        const active = match(pathname);
        return (
            <Link
                key={href}
                href={href}
                className={clsx(
                    'w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 font-medium group',
                    active ? 'bg-amber-500 text-[#0B1E40] shadow-lg shadow-amber-500/20' : 'text-slate-300 hover:bg-white/10 hover:text-white',
                )}
            >
                <Icon size={20} className={clsx('mr-3 transition-colors', active ? 'text-[#0B1E40]' : 'text-slate-400 group-hover:text-cyan-400')} />
                {label}
            </Link>
        );
    };

    return (
        <div className="w-72 bg-[#0B1E40] text-white flex flex-col shadow-2xl z-20 shrink-0 overflow-y-auto">
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

            <div className="p-5 border-t border-white/10 bg-black/20">
                <div className="flex items-center mb-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Sesión activa</p>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg border border-white/10 p-3">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-400 truncate">{roleLabel(currentUser.role)}</p>
                    </div>
                    <Link href="/cuenta" title="Mi cuenta / cambiar contraseña" className="p-2 text-slate-400 hover:text-cyan-400 transition-colors shrink-0">
                        <KeyRound size={18} />
                    </Link>
                    <form action={logoutAction}>
                        <button type="submit" title="Cerrar sesión" className="p-2 text-slate-400 hover:text-red-400 transition-colors shrink-0">
                            <LogOut size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
