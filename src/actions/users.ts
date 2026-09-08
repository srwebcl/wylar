'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { userSchema } from '@/lib/validation';

export interface UserFormState {
    error?: string;
    success?: string;
}

/** Alta de un nuevo miembro del equipo comercial. Solo administradores. */
export async function createUser(_prevState: UserFormState, formData: FormData): Promise<UserFormState> {
    await requireAdmin();

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

    revalidatePath('/equipo');
    return { success: 'Usuario creado.' };
}

/** Activa/desactiva a un miembro del equipo (no se elimina: conserva el historial de gestiones). */
export async function toggleUserActive(userId: number) {
    const currentUser = await requireAdmin();
    if (currentUser.id === userId) return; // no puede desactivarse a sí mismo

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await prisma.user.update({ where: { id: userId }, data: { active: !user.active } });
    revalidatePath('/equipo');
}
