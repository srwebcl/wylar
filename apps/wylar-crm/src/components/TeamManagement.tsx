'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { Shield, Plus, X, Power, Pencil, Trash2 } from 'lucide-react';
import type { SafeUser as User } from '@/lib/safeUser';
import { createUser, updateUser, deleteUser, toggleUserActive, type UserFormState } from '@/actions/users';
import { ROLES, roleLabel } from '@/lib/constants';
import { Select } from '@/components/ui/Select';

const initialState: UserFormState = {};

export function TeamManagement({ users, currentUserId }: { users: User[]; currentUserId: number }) {
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [state, formAction, pending] = useActionState(createUser, initialState);
    const [role, setRole] = useState('COMERCIAL');
    const [, startTransition] = useTransition();
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

    function openEdit(user: User) {
        setShowForm(false);
        setEditingUser(user);
    }

    function handleDelete(user: User) {
        if (!confirm(`¿Eliminar a ${user.name} (${user.email})? Esta acción no se puede deshacer.`)) return;
        setDeleteError(null);
        setPendingDeleteId(user.id);
        startTransition(async () => {
            const result = await deleteUser(user.id);
            if (result.error) setDeleteError(result.error);
            setPendingDeleteId(null);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                        <Shield className="mr-3 text-[#0B1E40]" size={28} />
                        Equipo comercial
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Administra quién puede acceder al CRM y a quién se le asignan los prospectos.</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setEditingUser(null); setShowForm(true); }}
                        className="flex items-center justify-center px-4 py-2.5 bg-[#0B1E40] text-white rounded-xl hover:bg-[#122b59] transition-colors shadow-md font-medium text-sm w-full sm:w-auto"
                    >
                        <Plus size={18} className="mr-2" /> Nuevo miembro
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-card p-4 sm:p-6 border-t-4 border-t-amber-500 relative">
                    <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">Crear nuevo miembro del equipo</h3>
                    <form action={formAction} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo *</label>
                                <input name="name" required type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40] outline-none" placeholder="Ej. Roberto Sánchez" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol *</label>
                                <Select name="role" required value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r.value, label: r.label }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo corporativo *</label>
                                <input name="email" required type="email" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40] outline-none" placeholder="nombre@wylar.cl" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña *</label>
                                <input name="password" required type="password" minLength={12} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40] outline-none" placeholder="Mínimo 12 caracteres" />
                            </div>
                        </div>

                        {state.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{state.error}</div>}

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button type="submit" disabled={pending} className="w-full sm:w-auto px-6 py-2.5 bg-[#0B1E40] text-white font-bold rounded-lg hover:bg-[#122b59] transition-colors shadow-md disabled:opacity-70">
                                {pending ? 'Guardando...' : 'Guardar miembro'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {editingUser && <EditUserForm user={editingUser} onClose={() => setEditingUser(null)} />}

            {deleteError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{deleteError}</div>}

            <div className="space-y-3">
                {/* Vista móvil: tarjetas táctiles */}
                <div className="block sm:hidden space-y-3">
                    {users.map((u) => (
                        <div key={u.id} className="glass-card bg-white p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0B1E40] to-cyan-600 text-white flex items-center justify-center text-xs font-bold mr-3 shrink-0">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="font-bold text-slate-800 block text-sm truncate">{u.name}</span>
                                        <span className="text-xs text-slate-400 block truncate">{u.email}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200">{roleLabel(u.role)}</span>
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${u.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        {u.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                                {u.id === currentUserId ? (
                                    <span className="text-xs text-slate-400 italic">Tu cuenta — edítala en /cuenta</span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(u)}
                                            className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <Pencil size={13} /> Editar
                                        </button>
                                        <button
                                            onClick={() => startTransition(() => toggleUserActive(u.id))}
                                            className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <Power size={13} /> {u.active ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u)}
                                            disabled={pendingDeleteId === u.id}
                                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Vista desktop: tabla */}
                <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/90 text-slate-500 text-xs border-b border-slate-200">
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
                                            {u.id === currentUserId ? (
                                                <span className="text-xs text-slate-400 italic">Tu cuenta — edítala en /cuenta</span>
                                            ) : (
                                                <div className="flex items-center justify-end gap-4">
                                                    <button
                                                        onClick={() => openEdit(u)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0B1E40] transition-colors"
                                                    >
                                                        <Pencil size={14} /> Editar
                                                    </button>
                                                    <button
                                                        onClick={() => startTransition(() => toggleUserActive(u.id))}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
                                                    >
                                                        <Power size={14} /> {u.active ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u)}
                                                        disabled={pendingDeleteId === u.id}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} /> {pendingDeleteId === u.id ? 'Eliminando…' : 'Eliminar'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Formulario de edición, pre-rellenado — una instancia propia de useActionState
 * ligada (bind) al id del usuario que se está editando. */
function EditUserForm({ user, onClose }: { user: User; onClose: () => void }) {
    const boundUpdateUser = updateUser.bind(null, user.id);
    const [state, formAction, pending] = useActionState(boundUpdateUser, initialState);
    const [role, setRole] = useState(user.role);

    useEffect(() => {
        if (state.success) onClose();
    }, [state.success, onClose]);

    return (
        <div className="glass-card p-6 border-t-4 border-t-cyan-500 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Editar a {user.name}</h3>
            <form action={formAction} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo *</label>
                        <input name="name" required type="text" defaultValue={user.name} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40] outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol *</label>
                        <Select name="role" required value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r.value, label: r.label }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo corporativo *</label>
                        <input name="email" required type="email" defaultValue={user.email} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40] outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nueva contraseña</label>
                        <input name="password" type="password" minLength={12} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0B1E40] outline-none" placeholder="Dejar en blanco para no cambiarla" />
                    </div>
                </div>

                {state.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-3">{state.error}</div>}
                {state.success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl p-3">{state.success}</div>}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={pending} className="w-full sm:w-auto px-6 py-2.5 bg-[#0B1E40] text-white font-bold rounded-lg hover:bg-[#122b59] transition-colors shadow-md disabled:opacity-70">
                        {pending ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}
