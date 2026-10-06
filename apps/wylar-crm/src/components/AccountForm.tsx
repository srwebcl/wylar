'use client';

import { useActionState, useEffect, useState } from 'react';
import { KeyRound, User as UserIcon } from 'lucide-react';
import { changePasswordAction, updateProfileAction, type ChangePasswordState, type UpdateProfileState } from '@/actions/auth';

const initialPasswordState: ChangePasswordState = {};
const initialProfileState: UpdateProfileState = {};
const inputClass = 'w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1E40] outline-none transition-all';

export function AccountForm({ name, email }: { name: string; email: string }) {
    const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, initialProfileState);
    const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, initialPasswordState);
    const [passwordKey, setPasswordKey] = useState(0);

    useEffect(() => {
        if (passwordState.success) setPasswordKey((k) => k + 1);
    }, [passwordState.success]);

    return (
        <div className="max-w-xl space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Mi cuenta</h1>
                <p className="text-slate-500 text-sm mt-1">{email}</p>
            </div>

            <form action={profileAction} className="glass-card p-6 space-y-5">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <UserIcon size={18} className="text-amber-500" /> Editar perfil
                </h2>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre completo</label>
                    <input name="name" type="text" defaultValue={name} required className={inputClass} />
                </div>

                {profileState.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{profileState.error}</div>}
                {profileState.success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl p-3">{profileState.success}</div>}

                <button type="submit" disabled={profilePending} className="bg-[#0B1E40] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#122b59] transition-all disabled:opacity-70">
                    {profilePending ? 'Guardando…' : 'Guardar nombre'}
                </button>
            </form>

            <form key={passwordKey} action={passwordAction} className="glass-card p-6 space-y-5">
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

                {passwordState.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{passwordState.error}</div>}
                {passwordState.success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl p-3">{passwordState.success}</div>}

                <button type="submit" disabled={passwordPending} className="bg-[#0B1E40] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#122b59] transition-all disabled:opacity-70">
                    {passwordPending ? 'Guardando…' : 'Cambiar contraseña'}
                </button>
            </form>
        </div>
    );
}
