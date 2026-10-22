'use client';

import { useActionState, useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, User as UserIcon } from 'lucide-react';
import { changePasswordAction, updateProfileAction, type ChangePasswordState, type UpdateProfileState } from '@/actions/auth';

const initialPasswordState: ChangePasswordState = {};
const initialProfileState: UpdateProfileState = {};

function PasswordField({
    name,
    label,
    autoComplete,
    minLength,
    helpText,
    required = true,
}: {
    name: string;
    label: string;
    autoComplete?: string;
    minLength?: number;
    helpText?: string;
    required?: boolean;
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{label}</label>
            <div className="relative">
                <input
                    name={name}
                    type={visible ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    minLength={minLength}
                    required={required}
                    className="w-full px-3.5 py-2.5 pr-11 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] outline-none transition-all"
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
                    aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
            {helpText && <p className="text-xs text-slate-400 mt-1.5">{helpText}</p>}
        </div>
    );
}

export function AccountForm({ name, email }: { name: string; email: string }) {
    const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, initialProfileState);
    const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, initialPasswordState);
    const [passwordKey, setPasswordKey] = useState(0);

    useEffect(() => {
        if (passwordState.success) setPasswordKey((k) => k + 1);
    }, [passwordState.success]);

    return (
        <div className="max-w-5xl space-y-6">
            {/* Cabecera de la sección */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Mi cuenta</h1>
                    <p className="text-slate-500 text-sm mt-1">Configuración del perfil personal y credenciales de acceso al CRM</p>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-xs self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{email}</span>
                </div>
            </div>

            {/* Cuadrícula de 2 columnas en desktop, 1 columna en móvil */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Formulario 1: Editar perfil */}
                <form action={profileAction} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                            <UserIcon size={19} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-base">Editar perfil</h2>
                            <p className="text-xs text-slate-400">Nombre visible en tus gestiones y bitácora</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nombre completo</label>
                        <input
                            name="name"
                            type="text"
                            defaultValue={name}
                            required
                            className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0B1E40]/20 focus:border-[#0B1E40] outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Correo corporativo</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none"
                        />
                        <p className="text-xs text-slate-400 mt-1.5">El correo es administrado centralmente por Wylar y no puede ser alterado.</p>
                    </div>

                    {profileState.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{profileState.error}</div>}
                    {profileState.success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl p-3">{profileState.success}</div>}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={profilePending}
                            className="w-full sm:w-auto bg-[#0B1E40] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#122b59] active:scale-[0.99] transition-all disabled:opacity-70 shadow-sm shadow-[#0B1E40]/20 cursor-pointer"
                        >
                            {profilePending ? 'Guardando…' : 'Guardar nombre'}
                        </button>
                    </div>
                </form>

                {/* Formulario 2: Cambiar contraseña */}
                <form key={passwordKey} action={passwordAction} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-center text-cyan-600 shrink-0">
                            <KeyRound size={19} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-base">Cambiar contraseña</h2>
                            <p className="text-xs text-slate-400">Actualiza tus credenciales de acceso</p>
                        </div>
                    </div>

                    <PasswordField
                        name="currentPassword"
                        label="Contraseña actual"
                        autoComplete="current-password"
                        required
                    />
                    <PasswordField
                        name="newPassword"
                        label="Nueva contraseña"
                        autoComplete="new-password"
                        minLength={12}
                        helpText="Mínimo 12 caracteres. Una frase larga es mejor que una palabra con símbolos."
                        required
                    />
                    <PasswordField
                        name="confirmPassword"
                        label="Repite la nueva contraseña"
                        autoComplete="new-password"
                        minLength={12}
                        required
                    />

                    {passwordState.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{passwordState.error}</div>}
                    {passwordState.success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl p-3">{passwordState.success}</div>}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={passwordPending}
                            className="w-full sm:w-auto bg-[#0B1E40] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#122b59] active:scale-[0.99] transition-all disabled:opacity-70 shadow-sm shadow-[#0B1E40]/20 cursor-pointer"
                        >
                            {passwordPending ? 'Guardando…' : 'Cambiar contraseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
