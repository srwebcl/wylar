'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin } from '@/lib/auth';
import { activityEntrySchema, assignSchema, manualLeadSchema, statusChangeSchema } from '@/lib/validation';
import { SYSTEM_ACTIVITY_TYPES, statusLabel } from '@/lib/constants';
import { audit } from '@/lib/audit';
import { findDuplicateOpenLead } from '@/lib/leadDuplicates';

export interface LeadFormState {
    error?: string;
    success?: string;
    // Cuando el bloqueo es por duplicado, se deja el código/id del prospecto
    // existente para que el formulario pueda ofrecer un link directo.
    duplicateLeadId?: number;
    duplicateLeadCode?: string;
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
 * Alta manual de un prospecto desde el propio CRM (botón "Nuevo prospecto"
 * en /leads). Aplica la misma regla de duplicados que el resto del
 * sistema: para Persona/Alumno Becado, si ya existe un prospecto ABIERTO
 * con el mismo correo o teléfono y el mismo interés de certificación, se
 * bloquea la creación y se informa cuál es el prospecto existente — las
 * empresas/instituciones/OTEC no tienen esta restricción (cada negocio es
 * su propio prospecto, aunque repita certificación).
 */
export async function createLeadManual(_prevState: LeadFormState, formData: FormData): Promise<LeadFormState> {
    const currentUser = await requireUser();

    const parsed = manualLeadSchema.safeParse({
        type: formData.get('type'),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company') || null,
        certificationInterest: formData.get('certificationInterest') || null,
        message: formData.get('message') || null,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    const data = parsed.data;

    const duplicate = await findDuplicateOpenLead({
        type: data.type,
        email: data.email,
        phone: data.phone,
        certificationInterest: data.certificationInterest,
    });
    if (duplicate) {
        return {
            error: `Ya existe un prospecto abierto para ${duplicate.name} con el mismo interés (${duplicate.code}). Gestiónalo ahí en vez de crear uno nuevo.`,
            duplicateLeadId: duplicate.id,
            duplicateLeadCode: duplicate.code,
        };
    }

    const lead = await prisma.lead.create({
        data: {
            code: `TEMP-${randomUUID()}`,
            type: data.type,
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company || null,
            certificationInterest: data.certificationInterest || null,
            message: data.message || null,
            source: 'MANUAL',
            sourceDetail: `Ingresado manualmente por ${currentUser.name}.`,
            status: 'NUEVO',
        },
    });
    const code = `LEAD-${1000 + lead.id}`;
    await prisma.lead.update({ where: { id: lead.id }, data: { code } });

    await prisma.leadActivity.create({
        data: {
            leadId: lead.id,
            userId: currentUser.id,
            authorName: currentUser.name,
            type: SYSTEM_ACTIVITY_TYPES.CREACION,
            text: `Prospecto ingresado manualmente por ${currentUser.name}.`,
        },
    });

    await audit(currentUser, 'LEAD_CREADO_MANUAL', 'lead', code, `${data.name} · ${data.email}`);

    revalidatePath('/leads');
    revalidatePath('/');
    return { success: `Prospecto ${code} creado.` };
}

/**
 * Cambia el estado del lead en el embudo de ventas. La usan tanto el
 * selector de la ficha (vía useActionState) como el tablero kanban
 * (llamado directamente al soltar una tarjeta, ver KanbanBoard.tsx).
 * `lostReason` es obligatorio cuando el nuevo estado es DESISTIDO.
 */
export async function changeLeadStatus(leadId: number, status: string, lostReason?: string | null) {
    const currentUser = await requireUser();

    if (!statusChangeSchema.safeParse({ status }).success) return { ok: false as const };
    if (status === 'DESISTIDO' && !lostReason?.trim()) return { ok: false as const, error: 'Ingresa el motivo del desistimiento.' };

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    if (lead.status === status) return { ok: true as const };

    await prisma.lead.update({
        where: { id: leadId },
        data: {
            status,
            closedAt: status === 'CERRADO' || status === 'DESISTIDO' ? new Date() : ['CERRADO', 'DESISTIDO'].includes(lead.status) ? null : lead.closedAt,
            lostReason: status === 'DESISTIDO' ? lostReason!.trim() : status === lead.status ? lead.lostReason : null,
        },
    });

    await prisma.leadActivity.create({
        data: {
            leadId,
            userId: currentUser.id,
            authorName: currentUser.name,
            type: SYSTEM_ACTIVITY_TYPES.CAMBIO_ESTADO,
            text:
                status === 'DESISTIDO'
                    ? `Estado cambiado de "${statusLabel(lead.status)}" a "${statusLabel(status)}". Motivo: ${lostReason!.trim()}`
                    : `Estado cambiado de "${statusLabel(lead.status)}" a "${statusLabel(status)}".`,
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
    const lostReason = formData.get('lostReason');
    if (typeof status !== 'string' || !statusChangeSchema.safeParse({ status }).success) return { error: 'Estado inválido.' };
    const result = await changeLeadStatus(leadId, status, typeof lostReason === 'string' ? lostReason : null);
    if (!result.ok) return { error: result.error ?? 'No se pudo actualizar el estado.' };
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
