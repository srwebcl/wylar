import Link from 'next/link';
import { KeyRound, LogOut, Menu } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { roleLabel } from '@/lib/constants';
import type { SafeUser as User } from '@/lib/safeUser';

/** Franja superior minimalista: solo identifica quién tiene la sesión
 * abierta y da acceso rápido a su perfil y a cerrar sesión. En móvil incluye
 * el botón para desplegar la navegación lateral. */
export function TopBar({
    currentUser,
    onToggleMenu,
}: {
    currentUser: User;
    onToggleMenu?: () => void;
}) {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-3.5 sm:px-6 md:px-8 py-2.5 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
            {/* Lado izquierdo: botón de menú en móviles */}
            <div className="flex items-center gap-2.5">
                <button
                    type="button"
                    onClick={onToggleMenu}
                    className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-[#0B1E40] hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                    aria-label="Abrir menú de navegación"
                >
                    <Menu size={22} />
                </button>
                <Link href="/" className="lg:hidden flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#0B1E40] tracking-tight">WYLAR <span className="text-amber-500 font-semibold">CRM</span></span>
                </Link>
            </div>

            {/* Lado derecho: usuario activo y opciones */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                <Link
                    href="/cuenta"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 hover:text-slate-900 transition-colors max-w-[140px] sm:max-w-none truncate"
                >
                    <span className="font-semibold text-slate-700 truncate">{currentUser.name}</span>
                    <span className="hidden sm:inline text-slate-300">·</span>
                    <span className="hidden sm:inline text-slate-500 text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{roleLabel(currentUser.role)}</span>
                </Link>
                <Link
                    href="/cuenta"
                    title="Mi cuenta / cambiar contraseña"
                    className="p-2 text-slate-400 hover:text-[#0B1E40] hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Mi cuenta"
                >
                    <KeyRound size={16} />
                </Link>
                <form action={logoutAction}>
                    <button
                        type="submit"
                        title="Cerrar sesión"
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Cerrar sesión"
                    >
                        <LogOut size={16} />
                    </button>
                </form>
            </div>
        </header>
    );
}
