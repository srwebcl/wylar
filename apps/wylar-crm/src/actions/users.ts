'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { userSchema, userUpdateSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export interface UserFormState {
    error?: string;
    success?: string;
}

/** Alta de un nuevo miembro del equipo comercial. Solo administradores. */
export async function createUser(_prevState: UserFormState, formData: FormData): Promise<UserFormState> {
    const admin = await requireAdmin();

    const parsed = userSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return { error: 'Ya existe un usuario con ese correo.' };

    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.user.create({
        data: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, passwordHash },
    });

    await audit(admin, 'USUARIO_CREADO', 'usuario', parsed.data.email, `rol ${parsed.data.role}`);
    revalidatePath('/equipo');
    return { success: 'Usuario creado.' };
}

/** Activa/desactiva a un miembro del equipo (alternativa a eliminar: conserva el historial de gestiones). */
export async function toggleUserActive(userId: number) {
    const currentUser = await requireAdmin();
    if (currentUser.id === userId) return; // no puede desactivarse a sí mismo

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await prisma.user.update({ where: { id: userId }, data: { active: !user.active } });
    await audit(currentUser, user.active ? 'USUARIO_DESACTIVADO' : 'USUARIO_ACTIVADO', 'usuario', user.email);
    revalidatePath('/equipo');
}

/**
 * Edita nombre, correo, rol y (opcional) contraseña de un miembro existente.
 * Solo administradores. La contraseña se deja intacta si se envía vacía.
 */
export async function updateUser(userId: number, _prevState: UserFormState, formData: FormData): Promise<UserFormState> {
    const admin = await requireAdmin();

    const parsed = userUpdateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing && existing.id !== userId) return { error: 'Ya existe otro usuario con ese correo.' };

    await prisma.user.update({
        where: { id: userId },
        data: {
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
            ...(parsed.data.password ? { passwordHash: await hashPassword(parsed.data.password) } : {}),
        },
    });

    await audit(admin, 'USUARIO_EDITADO', 'usuario', parsed.data.email, `rol ${parsed.data.role}${parsed.data.password ? ' · contraseña restablecida' : ''}`);
    revalidatePath('/equipo');
    return { success: 'Usuario actualizado.' };
}

/**
 * Elimina definitivamente a un miembro del equipo. Solo administradores, y
 * nadie puede eliminarse a sí mismo. Los leads/gestiones que haya dejado no
 * se pierden: assignedToId/userId son relaciones opcionales que quedan en
 * null, pero el nombre del autor de cada gestión ya está copiado como texto
 * plano (authorName) en el momento en que se registró, así que el historial
 * sigue siendo legible.
 */
export async function deleteUser(userId: number): Promise<UserFormState> {
    const admin = await requireAdmin();
    if (admin.id === userId) return { error: 'No puedes eliminar tu propia cuenta.' };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'El usuario no existe.' };

    await prisma.user.delete({ where: { id: userId } });
    await audit(admin, 'USUARIO_ELIMINADO', 'usuario', user.email, user.name);
    revalidatePath('/equipo');
    return { success: `Usuario ${user.name} eliminado.` };
}
