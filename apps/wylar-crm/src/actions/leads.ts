'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin } from '@/lib/auth';
import { activityEntrySchema, assignSchema, statusChangeSchema } from '@/lib/validation';
import { SYSTEM_ACTIVITY_TYPES, statusLabel } from '@/lib/constants';
import { audit } from '@/lib/audit';

export interface LeadFormState {
    error?: string;
    success?: string;
}

/** Registra una gestión (nota, llamada, WhatsApp, email, reunión) en la bitácora del lead. */
export async function addLeadActivity(leadId: number, _prevState: LeadFormState, formData: FormData): Promise<LeadFormState> {
    const currentUser = await requireUser();

    const parsed = activityEntrySchema.safeParse({ type: formData.get('type'), text: formData.get('text') });
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    }

    await prisma.leadActivity.create({
        data: { leadId, userId: currentUser.id, authorName: currentUser.name, type: parsed.data.type, text: parsed.data.text },
    });

    await markFirstAttendedIfNeeded(leadId);

    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/');
    revalidatePath('/leads');
    return { success: 'Gestión registrada.' };
}

/**
 * Cambia el estado del lead en el embudo de ventas. La usan tanto el
 * selector de la ficha (vía useActionState) como el tablero kanban
 * (llamado directamente al soltar una tarjeta, ver KanbanBoard.tsx).
 */
export async function changeLeadStatus(leadId: number, status: string) {
    const currentUser = await requireUser();

    if (!statusChangeSchema.safeParse({ status }).success) return { ok: false as const };

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    if (lead.status === status) return { ok: true as const };

    await prisma.lead.update({
        where: { id: leadId },
        data: {
            status,
            closedAt: status === 'CERRADO' ? new Date() : lead.status === 'CERRADO' ? null : lead.closedAt,
        },
    });

    await prisma.leadActivity.create({
        data: {
            leadId,
            userId: currentUser.id,
            authorName: currentUser.name,
            type: SYSTEM_ACTIVITY_TYPES.CAMBIO_ESTADO,
            text: `Estado cambiado de "${statusLabel(lead.status)}" a "${statusLabel(status)}".`,
        },
    });

    await markFirstAttendedIfNeeded(leadId);

    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/');
    revalidatePath('/leads');
    return { ok: true as const };
}

/** Variante para <form action> con useActionState (usada en la ficha del lead). */
export async function changeLeadStatusForm(leadId: number, _prevState: LeadFormState, formData: FormData): Promise<LeadFormState> {
    const status = formData.get('status');
    if (typeof status !== 'string' || !statusChangeSchema.safeParse({ status }).success) return { error: 'Estado inválido.' };
    await changeLeadStatus(leadId, status);
    return { success: 'Estado actualizado.' };
}

/** Asignación de responsables: delega el lead a un miembro del equipo (o lo deja sin asignar). */
export async function assignLead(leadId: number, formData: FormData) {
    const currentUser = await requireUser();
    const parsedAssign = assignSchema.safeParse({ assignedToId: formData.get('assignedToId') || null });
    if (!parsedAssign.success) return;
    const newAssigneeId = parsedAssign.data.assignedToId ?? null;

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    if (lead.assignedToId === newAssigneeId) return;

    const newAssignee = newAssigneeId ? await prisma.user.findUnique({ where: { id: newAssigneeId } }) : null;

    await prisma.lead.update({ where: { id: leadId }, data: { assignedToId: newAssignee?.id ?? null } });
    await prisma.leadActivity.create({
        data: {
            leadId,
            userId: currentUser.id,
            authorName: currentUser.name,
            type: SYSTEM_ACTIVITY_TYPES.ASIGNACION,
            text: newAssignee ? `Asignado a: ${newAssignee.name}.` : 'Quedó sin responsable asignado.',
        },
    });

    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/');
    revalidatePath('/leads');
}

/**
 * Elimina un prospecto (ej. registros de prueba). Solo administradores —
 * la baja queda registrada en /auditoria (quién, cuándo, código y datos
 * del lead borrado) porque es destructiva e irreversible. Los certificados
 * que estuvieran vinculados a este lead no se borran, solo pierden el
 * vínculo (Certificate.leadId queda en null, ver schema.prisma).
 */
export async function deleteLead(leadId: number): Promise<LeadFormState> {
    const admin = await requireAdmin();

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { error: 'El prospecto no existe.' };

    await prisma.lead.delete({ where: { id: leadId } });
    await audit(admin, 'LEAD_ELIMINADO', 'lead', lead.code, `${lead.name} · ${lead.email}`);

    revalidatePath('/leads');
    revalidatePath('/');
    return { success: `Prospecto ${lead.code} eliminado.` };
}

/** Auditoría de Tiempos de Respuesta: registra la fecha de la primera atención, una sola vez. */
async function markFirstAttendedIfNeeded(leadId: number) {
    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    if (lead.firstAttendedAt) return;
    await prisma.lead.update({ where: { id: leadId }, data: { firstAttendedAt: new Date() } });
}
