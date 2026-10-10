'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { doNotContactSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export interface DoNotContactState {
    error?: string;
    success?: string;
}

/**
 * Marca un contacto (por correo y/o teléfono) como "no contactar" — queda
 * a nivel de persona, no del prospecto puntual: si en el futuro se crea
 * otro prospecto con ese mismo correo/teléfono, la alerta vuelve a
 * aparecer (ver lib/doNotContact.ts). Cualquier usuario con sesión puede
 * marcarla (es una alerta protectora, no una acción destructiva).
 */
export async function markDoNotContact(email: string, phone: string, _prevState: DoNotContactState, formData: FormData): Promise<DoNotContactState> {
    const user = await requireUser();

    const parsed = doNotContactSchema.safeParse({ email, phone, reason: formData.get('reason') });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };

    await prisma.doNotContactEntry.create({
        data: { email: parsed.data.email || null, phone: parsed.data.phone || null, reason: parsed.data.reason, createdByName: user.name },
    });
    await audit(user, 'NO_CONTACTAR_MARCADO', 'contacto', email || phone, parsed.data.reason);

    revalidatePath('/leads');
    revalidatePath('/');
    return { success: 'Contacto marcado como no contactar.' };
}

/** Quita la marca de "no contactar" para un correo/teléfono — borra todas
 * las entradas que calcen (puede haber más de una si se marcó dos veces). */
export async function unmarkDoNotContact(email: string, phone: string): Promise<DoNotContactState> {
    const user = await requireUser();

    const result = await prisma.doNotContactEntry.deleteMany({ where: { OR: [{ email }, { phone }] } });
    if (result.count === 0) return { error: 'No había ninguna marca para este contacto.' };

    await audit(user, 'NO_CONTACTAR_QUITADO', 'contacto', email || phone, `${result.count} marca(s) eliminada(s)`);

    revalidatePath('/leads');
    revalidatePath('/');
    return { success: 'Marca eliminada.' };
}
