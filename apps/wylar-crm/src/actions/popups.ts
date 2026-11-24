'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { deleteBlobIfUnused } from '@/lib/blob';
import { popupSchema, type PopupInput } from '@/lib/validation';

export interface PopupFormState {
    error?: string;
    success?: string;
}

/** Crea o actualiza un pop-up. */
export async function savePopup(input: PopupInput, popupId?: number | null): Promise<PopupFormState> {
    await requireUser();

    const parsed = popupSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del pop-up.' };
    }
    const data = parsed.data;

    if (popupId) {
        await prisma.popup.update({ where: { id: popupId }, data });
    } else {
        await prisma.popup.create({ data });
    }

    revalidatePath('/popups');
    return { success: popupId ? 'Pop-up actualizado.' : 'Pop-up creado.' };
}

/** Eliminar un pop-up es irreversible: solo ADMIN. */
export async function deletePopup(popupId: number): Promise<PopupFormState> {
    const admin = await requireAdmin();
    const popup = await prisma.popup.findUnique({ where: { id: popupId } });
    if (!popup) return { error: 'El pop-up no existe.' };
    await prisma.popup.delete({ where: { id: popupId } });
    await deleteBlobIfUnused(popup.image);
    await audit(admin, 'POPUP_ELIMINADO', 'popup', popupId, popup.title);
    revalidatePath('/popups');
    return { success: 'Pop-up eliminado.' };
}

/** Activa/desactiva un pop-up sin borrarlo (para pausarlo temporalmente). */
export async function togglePopupActive(popupId: number) {
    await requireUser();
    const popup = await prisma.popup.findUniqueOrThrow({ where: { id: popupId } });
    await prisma.popup.update({ where: { id: popupId }, data: { active: !popup.active } });
    revalidatePath('/popups');
}
