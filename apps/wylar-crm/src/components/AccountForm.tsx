'use client';

import { useActionState } from 'react';
import { KeyRound } from 'lucide-react';
import { changePasswordAction, type ChangePasswordState } from '@/actions/auth';

const initialState: ChangePasswordState = {};
const inputClass = 'w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1E40] outline-none transition-all';

export function AccountForm({ name, email }: { name: string; email: string }) {
    const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

    return (
        <div className="max-w-xl space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Mi cuenta</h1>
                <p className="text-slate-500 text-sm mt-1">
                    {name} · {email}
                </p>
            </div>

            <form action={formAction} className="glass-card p-6 space-y-5">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound size={18} className="text-amber-500" /> Cambiar contraseña
                </h2>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Contraseña actual</label>
                    <input name="currentPassword" type="password" autoComplete="current-password" required className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nueva contraseña</label>
                    <input name="newPassword" type="password" autoComplete="new-password" minLength={12} required className={inputClass} />
                    <p className="text-xs text-slate-400 mt-1">Mínimo 12 caracteres. Una frase larga es mejor que una palabra con símbolos.</p>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Repite la nueva contraseña</label>
                    <input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required className={inputClass} />
                </div>

                {state.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{state.error}</div>}
                {state.success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl p-3">{state.success}</div>}

                <button type="submit" disabled={pending} className="bg-[#0B1E40] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#122b59] transition-all disabled:opacity-70">
                    {pending ? 'Guardando…' : 'Cambiar contraseña'}
                </button>
            </form>
        </div>
    );
}
