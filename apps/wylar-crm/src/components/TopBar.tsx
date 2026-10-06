import Link from 'next/link';
import { KeyRound, LogOut } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { roleLabel } from '@/lib/constants';
import type { SafeUser as User } from '@/lib/safeUser';

/** Franja superior minimalista: solo identifica quién tiene la sesión
 * abierta y da acceso rápido a su perfil y a cerrar sesión. Reemplaza el
 * bloque "Sesión activa" que antes vivía al fondo del sidebar. */
export function TopBar({ currentUser }: { currentUser: User }) {
    return (
        <header className="sticky top-0 z-10 flex items-center justify-end gap-3 px-6 md:px-8 py-2.5 bg-white/80 backdrop-blur-sm border-b border-slate-200/70">
            <Link href="/cuenta" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <span className="font-semibold text-slate-700">{currentUser.name}</span>
                <span className="text-slate-300">·</span>
                <span>{roleLabel(currentUser.role)}</span>
            </Link>
            <Link href="/cuenta" title="Mi cuenta / cambiar contraseña" className="p-1.5 text-slate-400 hover:text-[#0B1E40] transition-colors">
                <KeyRound size={16} />
            </Link>
            <form action={logoutAction}>
                <button type="submit" title="Cerrar sesión" className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                    <LogOut size={16} />
                </button>
            </form>
        </header>
    );
}
