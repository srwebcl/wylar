'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { activityEntrySchema, publicLeadSchema } from '@/lib/validation';
import { SYSTEM_ACTIVITY_TYPES, statusLabel } from '@/lib/constants';
import { resolveSource } from '@/lib/leadSource';

export interface LeadFormState {
    error?: string;
    success?: string;
}

/**
 * Módulo de Captura de Oportunidades: crea un lead a partir del formulario
 * público de wylar.cl. Se usa desde app/api/public/leads/route.ts (no es un
 * <form action> directo porque el formulario vive en otro sitio/origen).
 */
export async function createLeadFromPublicForm(input: unknown, refererHeader: string | null) {
    const parsed = publicLeadSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    // Honeypot: si el campo trampa viene con contenido, es un bot — se
    // responde éxito igualmente para no delatar el filtro.
    if (parsed.data.website) {
        return { ok: true as const, id: 0, code: 'IGNORADO' };
    }

    const { website: _website, ...data } = parsed.data;
    const source = resolveSource(data.source, refererHeader);

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
            source,
            sourceDetail: data.sourceDetail || refererHeader || null,
            status: 'NUEVO',
        },
    });

    // El código de referencia se deriva del id autoincremental, solo
    // disponible después del insert.
    const code = `LEAD-${1000 + lead.id}`;
    await prisma.lead.update({ where: { id: lead.id }, data: { code } });

    await prisma.leadActivity.create({
        data: {
            leadId: lead.id,
            userId: null,
            authorName: 'Sistema',
            type: SYSTEM_ACTIVITY_TYPES.CREACION,
            text: `Prospecto ingresado automáticamente desde el sitio web (canal: ${source}).`,
        },
    });

    revalidatePath('/');
    revalidatePath('/leads');
    return { ok: true as const, id: lead.id, code };
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
    if (typeof status !== 'string' || !status) return { error: 'Estado inválido.' };
    await changeLeadStatus(leadId, status);
    return { success: 'Estado actualizado.' };
}

/** Asignación de responsables: delega el lead a un miembro del equipo (o lo deja sin asignar). */
export async function assignLead(leadId: number, formData: FormData) {
    const currentUser = await requireUser();
    const raw = formData.get('assignedToId');
    const newAssigneeId = raw ? Number(raw) : null;

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

/** Auditoría de Tiempos de Respuesta: registra la fecha de la primera atención, una sola vez. */
async function markFirstAttendedIfNeeded(leadId: number) {
    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    if (lead.firstAttendedAt) return;
    await prisma.lead.update({ where: { id: leadId }, data: { firstAttendedAt: new Date() } });
}
