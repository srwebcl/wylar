'use client';

import { useActionState, useState, useTransition } from 'react';
import { Shield, Plus, X, Power } from 'lucide-react';
import type { User } from '@prisma/client';
import { createUser, toggleUserActive, type UserFormState } from '@/actions/users';
import { ROLES, roleLabel } from '@/lib/constants';

const initialState: UserFormState = {};

export function TeamManagement({ users, currentUserId }: { users: User[]; currentUserId: number }) {
    const [showForm, setShowForm] = useState(false);
    const [state, formAction, pending] = useActionState(createUser, initialState);
    const [, startTransition] = useTransition();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center">
                        <Shield className="mr-3 text-[#0B1E40]" size={28} />
                        Equipo comercial
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Administra quién puede acceder al CRM y a quién se le asignan los prospectos.</p>
                </div>
                {!showForm && (
                    <button onClick={() => setShowForm(true)} className="flex items-center px-4 py-2.5 bg-[#0B1E40] text-white rounded-xl hover:bg-[#122b59] transition-colors shadow-md font-medium text-sm">
                        <Plus size={18} className="mr-2" /> Nuevo miembro
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-card p-6 border-t-4 border-t-amber-500 relative">
                    <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Crear nuevo miembro del equipo</h3>
                    <form action={formAction} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre completo *</label>
                                <input name="name" required type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40] outline-none" placeholder="Ej. Roberto Sánchez" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Rol *</label>
                                <select name="role" required defaultValue="COMERCIAL" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40] outline-none">
                                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Correo corporativo *</label>
                                <input name="email" required type="email" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40] outline-none" placeholder="nombre@wylar.cl" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Contraseña *</label>
                                <input name="password" required type="password" minLength={4} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40] outline-none" placeholder="Mínimo 4 caracteres" />
                            </div>
                        </div>

                        {state.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{state.error}</div>}

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button type="submit" disabled={pending} className="px-6 py-2.5 bg-[#0B1E40] text-white font-bold rounded-lg hover:bg-[#122b59] transition-colors shadow-md disabled:opacity-70">
                                {pending ? 'Guardando...' : 'Guardar miembro'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                            <th className="p-4 pl-6 font-semibold">Usuario</th>
                            <th className="p-4 font-semibold">Rol</th>
                            <th className="p-4 font-semibold">Estado</th>
                            <th className="p-4 font-semibold text-right pr-6">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0B1E40] to-cyan-600 text-white flex items-center justify-center text-xs font-bold mr-3">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800 block">{u.name}</span>
                                            <span className="text-xs text-slate-400">{u.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold border border-slate-200">{roleLabel(u.role)}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${u.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        {u.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    {u.id !== currentUserId && (
                                        <button
                                            onClick={() => startTransition(() => toggleUserActive(u.id))}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
                                        >
                                            <Power size={14} /> {u.active ? 'Desactivar' : 'Activar'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
