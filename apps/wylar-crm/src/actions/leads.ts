'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin } from '@/lib/auth';
import { activityEntrySchema, assignSchema, manualLeadSchema, statusChangeSchema } from '@/lib/validation';
import { SYSTEM_ACTIVITY_TYPES, statusLabel } from '@/lib/constants';
import { audit } from '@/lib/audit';
import { findDuplicateOpenLead, findSimilarOpenOpportunity } from '@/lib/leadDuplicates';
import { normalizeRut, formatRut } from '@/lib/rut';
import { formatChileanMobile } from '@/lib/phone';
import { findOrCreateClient } from '@/lib/clients';

export async function updateOpportunityFromQuote(
    leadId: number,
    data: {
        name: string;
        email: string;
        phone: string;
        company?: string | null;
        comuna?: string | null;
        rut?: string | null;
    },
): Promise<{
    ok: boolean;
    error?: string;
    lead?: {
        id: number;
        code: string;
        name: string;
        rut: string | null;
        email: string;
        phone: string;
        company: string | null;
        comuna: string | null;
    };
}> {
    const currentUser = await requireUser();
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { ok: false, error: 'Oportunidad no encontrada.' };

    const name = data.name.trim().toUpperCase();
    const email = data.email.trim().toLowerCase();
    const formattedPhone = formatChileanMobile(data.phone) ?? data.phone.trim();
    const rutNorm = data.rut ? normalizeRut(data.rut) : null;
    const company = data.company?.trim().toUpperCase() || null;
    const comuna = data.comuna?.trim() || null;

    const updated = await prisma.lead.update({
        where: { id: leadId },
        data: {
            name,
            email,
            phone: formattedPhone,
            rut: data.rut ? formatRut(data.rut) : lead.rut,
            rutNorm: rutNorm ?? lead.rutNorm,
            company,
            comuna,
        },
        select: {
            id: true,
            code: true,
            name: true,
            rut: true,
            email: true,
            phone: true,
            company: true,
            comuna: true,
        },
    });

    await prisma.leadActivity.create({
        data: {
            leadId,
            userId: currentUser.id,
            authorName: currentUser.name,
            type: 'NOTA',
            text: `Datos corregidos desde emisión de cotización por ${currentUser.name}: Correo=${email}, Teléfono=${formattedPhone}.`,
        },
    });

    await audit(currentUser, 'LEAD_EDITADO_DESDE_COTIZACION', 'lead', lead.code, `${name} (${email})`);

    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/leads');

    return { ok: true, lead: updated };
}

export interface LeadFormState {
    error?: string;
    success?: string;
    // Cuando el bloqueo es por duplicado, se deja el código/id de la
    // oportunidad existente para que el formulario pueda ofrecer un link directo.
    duplicateLeadId?: number;
    duplicateLeadCode?: string;
    // Para empresas/OTEC/instituciones: no bloquea, solo informa que ya
    // existe algo similar — el formulario debe reenviar con
    // confirmSimilar=1 para crearla igual.
    similarOpportunityId?: number;
    similarOpportunityCode?: string;
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
 * Alta manual de una oportunidad desde el propio CRM (botón "Nueva
 * oportunidad" en /leads). Aplica la misma regla de duplicados que el
 * resto del sistema: para Persona/Alumno Becado, si ya existe una
 * oportunidad ABIERTA con el mismo correo/teléfono/RUT y el mismo
 * producto, se bloquea la creación y se informa cuál es la existente —
 * las empresas/instituciones/OTEC no tienen esa restricción dura, solo se
 * les advierte (no bloqueante, ver confirmSimilar).
 */
export async function createLeadManual(_prevState: LeadFormState, formData: FormData): Promise<LeadFormState> {
    const currentUser = await requireUser();

    const parsed = manualLeadSchema.safeParse({
        type: formData.get('type'),
        name: formData.get('name'),
        rut: formData.get('rut'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company') || null,
        productId: formData.get('productId'),
        comuna: formData.get('comuna') || null,
        message: formData.get('message') || null,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    const data = parsed.data;

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) return { error: 'El producto seleccionado no existe.' };

    const duplicate = await findDuplicateOpenLead({ type: data.type, email: data.email, phone: data.phone, rut: data.rut, productId: data.productId });
    if (duplicate) {
        return {
            error: `Ya existe una oportunidad abierta para ${duplicate.name} con el mismo producto (${duplicate.code}). Gestiónala ahí en vez de crear una nueva.`,
            duplicateLeadId: duplicate.id,
            duplicateLeadCode: duplicate.code,
        };
    }

    const confirmSimilar = formData.get('confirmSimilar') === '1';
    if (!confirmSimilar) {
        const similar = await findSimilarOpenOpportunity({ type: data.type, email: data.email, phone: data.phone, rut: data.rut, productId: data.productId });
        if (similar) {
            return {
                error: `Ya existe una oportunidad similar abierta (${similar.code}). Puedes crear esta igual si corresponde a un negocio distinto.`,
                similarOpportunityId: similar.id,
                similarOpportunityCode: similar.code,
            };
        }
    }

    const normalizedName = data.name.trim().toUpperCase();
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedPhone = formatChileanMobile(data.phone) ?? data.phone;
    const normalizedCompany = data.company ? data.company.trim().toUpperCase() : null;
    const normalizedComuna = data.comuna ? data.comuna.trim() : null;

    const client = await findOrCreateClient({
        type: data.type,
        name: normalizedName,
        rut: data.rut,
        rutNorm: normalizeRut(data.rut),
        email: normalizedEmail,
        phone: normalizedPhone,
        company: normalizedCompany,
    });

    const lead = await prisma.lead.create({
        data: {
            code: `TEMP-${randomUUID()}`,
            type: data.type,
            name: normalizedName,
            rut: data.rut,
            rutNorm: normalizeRut(data.rut),
            email: normalizedEmail,
            phone: normalizedPhone,
            company: normalizedCompany,
            clientId: client.id,
            productId: product.id,
            certificationInterest: product.name,
            comuna: normalizedComuna,
            message: data.message ? data.message.trim() : null,
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
            text: `Oportunidad ingresada manualmente por ${currentUser.name}.`,
        },
    });

    await audit(currentUser, 'LEAD_CREADO_MANUAL', 'lead', code, `${data.name} · ${data.email}`);

    revalidatePath('/leads');
    revalidatePath('/');
    return { success: `Oportunidad ${code} creada.` };
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

/** Edita los datos de contacto y comerciales de una oportunidad desde el CRM. */
export async function updateLead(leadId: number, formData: FormData): Promise<LeadFormState> {
    const currentUser = await requireUser();

    const name = (formData.get('name') as string)?.trim().toUpperCase();
    const rut = (formData.get('rut') as string)?.trim() || null;
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const phone = (formData.get('phone') as string)?.trim();
    const company = (formData.get('company') as string)?.trim().toUpperCase() || null;
    const comuna = (formData.get('comuna') as string)?.trim() || null;
    const productIdStr = formData.get('productId') as string;
    const status = formData.get('status') as string;
    const assignedToIdStr = formData.get('assignedToId') as string;
    const notes = (formData.get('notes') as string)?.trim() || null;

    if (!name || !email || !phone) {
        return { error: 'Nombre, correo y teléfono son obligatorios.' };
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { error: 'La oportunidad no existe.' };

    const formattedPhone = formatChileanMobile(phone) ?? phone;
    const rutNorm = rut ? normalizeRut(rut) : null;
    const productId = productIdStr ? Number(productIdStr) : lead.productId;
    const assignedToId = assignedToIdStr === '' ? null : (assignedToIdStr ? Number(assignedToIdStr) : lead.assignedToId);

    await prisma.lead.update({
        where: { id: leadId },
        data: {
            name,
            rut,
            rutNorm,
            email,
            phone: formattedPhone,
            company,
            comuna,
            productId,
            status: status || lead.status,
            assignedToId,
            message: notes !== null ? notes : lead.message,
        },
    });

    if (lead.clientId) {
        await prisma.client.update({
            where: { id: lead.clientId },
            data: {
                name,
                rut: rut || undefined,
                rutNorm: rutNorm || undefined,
                email,
                phone: formattedPhone,
                company: company || undefined,
            },
        });
    }

    await prisma.leadActivity.create({
        data: {
            leadId,
            userId: currentUser.id,
            authorName: currentUser.name,
            type: 'NOTA',
            text: `Datos de contacto u oportunidad actualizados por ${currentUser.name}.`,
        },
    });

    await audit(currentUser, 'LEAD_EDITADO', 'lead', lead.code, `${name} · ${email}`);

    revalidatePath('/leads');
    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/clientes');
    revalidatePath('/');
    return { success: 'Oportunidad actualizada exitosamente.' };
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
    if (!lead) return { error: 'La oportunidad no existe.' };

    await prisma.lead.delete({ where: { id: leadId } });
    await audit(admin, 'LEAD_ELIMINADO', 'lead', lead.code, `${lead.name} · ${lead.email}`);

    revalidatePath('/leads');
    revalidatePath('/');
    return { success: `Oportunidad ${lead.code} eliminada.` };
}

/** Eliminación masiva de oportunidades seleccionadas (solo administradores). */
export async function bulkDeleteLeads(leadIds: number[]): Promise<LeadFormState> {
    const admin = await requireAdmin();
    if (!leadIds.length) return { error: 'No se seleccionaron oportunidades.' };

    const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        select: { id: true, code: true, name: true },
    });

    await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
    await audit(admin, 'LEADS_ELIMINADOS_MASIVO', 'lead', `${leads.length} oportunidades`, leads.map((l) => l.code).join(', '));

    revalidatePath('/leads');
    revalidatePath('/');
    return { success: `${leads.length} oportunidades eliminadas exitosamente.` };
}

/** Actualización masiva de estado para las oportunidades seleccionadas. */
export async function bulkUpdateLeadStatus(leadIds: number[], status: string, lostReason?: string | null): Promise<LeadFormState> {
    const user = await requireUser();
    if (!leadIds.length) return { error: 'No se seleccionaron oportunidades.' };
    if (!statusChangeSchema.safeParse({ status }).success) return { error: 'Estado inválido.' };

    const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        select: { id: true, code: true, status: true },
    });

    await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data: {
            status,
            lostReason: status === 'DESISTIDO' ? lostReason || 'Desistido en acción masiva' : null,
            closedAt: status === 'CERRADO' || status === 'DESISTIDO' ? new Date() : null,
        },
    });

    const label = statusLabel(status);
    await Promise.all(
        leads.map((l) =>
            prisma.leadActivity.create({
                data: {
                    leadId: l.id,
                    userId: user.id,
                    authorName: user.name,
                    type: SYSTEM_ACTIVITY_TYPES.CAMBIO_ESTADO,
                    text: `Estado actualizado a "${label}" en acción masiva por ${user.name}.`,
                },
            }),
        ),
    );

    await audit(user, 'LEADS_ESTADO_MASIVO', 'lead', `${leads.length} oportunidades`, `Nuevo estado: ${label}`);

    revalidatePath('/leads');
    revalidatePath('/');
    return { success: `Estado actualizado a "${label}" en ${leads.length} oportunidades.` };
}

/** Asignación masiva de responsable para las oportunidades seleccionadas. */
export async function bulkAssignLeads(leadIds: number[], assignedToId: number | null): Promise<LeadFormState> {
    const user = await requireUser();
    if (!leadIds.length) return { error: 'No se seleccionaron oportunidades.' };

    const assignee = assignedToId ? await prisma.user.findUnique({ where: { id: assignedToId } }) : null;

    await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data: { assignedToId: assignee?.id ?? null },
    });

    const assigneeText = assignee ? `Asignado a: ${assignee.name}.` : 'Quedó sin responsable asignado.';

    await Promise.all(
        leadIds.map((id) =>
            prisma.leadActivity.create({
                data: {
                    leadId: id,
                    userId: user.id,
                    authorName: user.name,
                    type: SYSTEM_ACTIVITY_TYPES.ASIGNACION,
                    text: `${assigneeText} (Acción masiva por ${user.name})`,
                },
            }),
        ),
    );

    await audit(user, 'LEADS_ASIGNACION_MASIVA', 'lead', `${leadIds.length} oportunidades`, assigneeText);

    revalidatePath('/leads');
    revalidatePath('/');
    return { success: `${leadIds.length} oportunidades reasignadas a ${assignee?.name ?? 'Sin asignar'}.` };
}

/** Auditoría de Tiempos de Respuesta: registra la fecha de la primera atención, una sola vez. */
async function markFirstAttendedIfNeeded(leadId: number) {
    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    if (lead.firstAttendedAt) return;
    await prisma.lead.update({ where: { id: leadId }, data: { firstAttendedAt: new Date() } });
}
