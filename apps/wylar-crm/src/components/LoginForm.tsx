'use client';

import { useActionState, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { loginAction, type LoginState } from '@/actions/auth';
import { Logo } from '@/components/Logo';

const initialState: LoginState = {};

export function LoginForm({ next }: { next?: string }) {
    const [state, formAction, pending] = useActionState(loginAction, initialState);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form action={formAction} className="glass-card w-full max-w-sm p-6 sm:p-8 border-t-4 border-t-amber-500 space-y-5">
            <div className="text-center mb-2">
                <span className="inline-flex items-center justify-center bg-[#0B1E40] rounded-2xl px-6 py-4 mb-4">
                    <Logo width={150} />
                </span>
                <h1 className="text-2xl font-extrabold text-slate-800">CRM Wylar</h1>
                <p className="text-slate-500 text-sm mt-1">Ingresa con tu correo corporativo</p>
            </div>

            {next && <input type="hidden" name="next" value={next} />}

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Correo corporativo</label>
                <input name="email" type="email" required autoFocus className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1E40] outline-none transition-all" placeholder="nombre@wylar.cl" />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Contraseña</label>
                <div className="relative">
                    <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full p-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B1E40] outline-none transition-all"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1.5 rounded-lg transition-colors cursor-pointer"
                        title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {state.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{state.error}</div>}

            <button type="submit" disabled={pending} className="w-full bg-[#0B1E40] text-white font-bold py-3 rounded-xl hover:bg-[#122b59] transition-all disabled:opacity-70">
                {pending ? 'Ingresando...' : 'Ingresar'}
            </button>
        </form>
    );
}
