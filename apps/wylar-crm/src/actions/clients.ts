'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin } from '@/lib/auth';
import { clientUpdateSchema, clientContactSchema, clientCreateSchema } from '@/lib/validation';
import { normalizeRut } from '@/lib/rut';
import { audit } from '@/lib/audit';

export interface ClientFormState {
    error?: string;
    success?: string;
    clientId?: number;
    duplicate?: boolean;
    duplicateReason?: 'rut' | 'email' | 'phone';
    existingClient?: {
        id: number;
        name: string;
        rut: string | null;
        email: string;
        phone: string;
        company: string | null;
        type: string;
    } | null;
}

/** Verifica si ya existe un cliente con el mismo RUT, email o teléfono */
export async function checkClientDuplicate(params: {
    rut?: string;
    email?: string;
    phone?: string;
}): Promise<{
    hasDuplicate: boolean;
    duplicateReason?: 'rut' | 'email' | 'phone';
    client?: {
        id: number;
        name: string;
        rut: string | null;
        email: string;
        phone: string;
        company: string | null;
        type: string;
    };
}> {
    await requireUser();
    const rutNorm = params.rut ? normalizeRut(params.rut) : '';
    const emailNorm = params.email?.trim().toLowerCase();
    const phoneNorm = params.phone?.trim();

    if (rutNorm) {
        const found = await prisma.client.findFirst({
            where: { rutNorm },
            select: { id: true, name: true, rut: true, email: true, phone: true, company: true, type: true },
        });
        if (found) {
            return { hasDuplicate: true, duplicateReason: 'rut', client: found };
        }
    }

    if (emailNorm) {
        const found = await prisma.client.findFirst({
            where: { email: { equals: emailNorm, mode: 'insensitive' } },
            select: { id: true, name: true, rut: true, email: true, phone: true, company: true, type: true },
        });
        if (found) {
            return { hasDuplicate: true, duplicateReason: 'email', client: found };
        }
    }

    if (phoneNorm) {
        const found = await prisma.client.findFirst({
            where: { phone: phoneNorm },
            select: { id: true, name: true, rut: true, email: true, phone: true, company: true, type: true },
        });
        if (found) {
            return { hasDuplicate: true, duplicateReason: 'phone', client: found };
        }
    }

    return { hasDuplicate: false };
}

/** Crea un nuevo cliente de forma manual, alertando si hay duplicados a menos que se fuerce */
export async function createClientManual(_prevState: ClientFormState, formData: FormData): Promise<ClientFormState> {
    const user = await requireUser();
    const force = formData.get('force') === 'true';

    const parsed = clientCreateSchema.safeParse({
        type: formData.get('type'),
        name: formData.get('name'),
        rut: formData.get('rut'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company') || null,
    });
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    }
    const data = parsed.data;
    const rutNorm = normalizeRut(data.rut);

    if (!force) {
        const dupCheck = await checkClientDuplicate({ rut: data.rut, email: data.email, phone: data.phone });
        if (dupCheck.hasDuplicate) {
            const reasonLabel = dupCheck.duplicateReason === 'rut' ? 'RUT' : dupCheck.duplicateReason === 'email' ? 'correo electrónico' : 'teléfono';
            return {
                duplicate: true,
                duplicateReason: dupCheck.duplicateReason,
                existingClient: dupCheck.client,
                error: `Ya existe un cliente con este ${reasonLabel}: ${dupCheck.client?.name}.`,
            };
        }
    }

    const newClient = await prisma.client.create({
        data: {
            type: data.type,
            name: data.name,
            rut: data.rut,
            rutNorm,
            email: data.email,
            phone: data.phone,
            company: data.company || null,
        },
    });

    await audit(user, 'CLIENTE_CREADO', 'cliente', String(newClient.id), newClient.name);
    revalidatePath('/clientes');
    return { success: 'Cliente creado exitosamente.', clientId: newClient.id };
}

/** Aplica resolución de discrepancia de contacto (actualizar principal o guardar secundario) */
export async function applyClientContactDiscrepancy(
    clientId: number,
    data: {
        action: 'UPDATE_PRIMARY' | 'ADD_SECONDARY';
        newEmail?: string;
        newPhone?: string;
        leadCode?: string;
    },
): Promise<{ ok: boolean; error?: string; success?: string }> {
    const user = await requireUser();
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return { ok: false, error: 'Cliente no encontrado.' };

    if (data.action === 'UPDATE_PRIMARY') {
        const updateData: { email?: string; phone?: string } = {};
        if (data.newEmail) updateData.email = data.newEmail.trim().toLowerCase();
        if (data.newPhone) updateData.phone = data.newPhone.trim();

        await prisma.client.update({
            where: { id: clientId },
            data: updateData,
        });

        await audit(
            user,
            'CLIENTE_ACTUALIZADO_DESDE_OPORTUNIDAD',
            'cliente',
            String(clientId),
            `Actualizados datos principales con info de ${data.leadCode ?? 'oportunidad'}`,
        );
        revalidatePath(`/clientes/${clientId}`);
        revalidatePath('/clientes');
        return { ok: true, success: 'Datos principales del cliente actualizados.' };
    }

    if (data.action === 'ADD_SECONDARY') {
        await prisma.clientContact.create({
            data: {
                clientId,
                name: `Contacto ${data.leadCode ?? 'adicional'}`,
                role: 'Contacto ingresado en oportunidad',
                email: data.newEmail?.trim().toLowerCase() || null,
                phone: data.newPhone?.trim() || null,
            },
        });

        await audit(
            user,
            'CONTACTO_SECUNDARIO_DESDE_OPORTUNIDAD',
            'cliente',
            String(clientId),
            `Agregado como contacto secundario desde ${data.leadCode ?? 'oportunidad'}`,
        );
        revalidatePath(`/clientes/${clientId}`);
        return { ok: true, success: 'Contacto secundario agregado con éxito.' };
    }

    return { ok: false, error: 'Acción no válida.' };
}

/** Edita la ficha de un cliente — cualquier usuario autenticado */
export async function updateClient(clientId: number, _prevState: ClientFormState, formData: FormData): Promise<ClientFormState> {
    const user = await requireUser();

    const parsed = clientUpdateSchema.safeParse({
        type: formData.get('type') || undefined,
        name: formData.get('name'),
        rut: formData.get('rut'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        company: formData.get('company') || null,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    const data = parsed.data;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return { error: 'El cliente no existe.' };

    await prisma.client.update({
        where: { id: clientId },
        data: {
            ...(data.type ? { type: data.type } : {}),
            name: data.name,
            rut: data.rut,
            rutNorm: normalizeRut(data.rut),
            email: data.email,
            phone: data.phone,
            company: data.company || null,
        },
    });

    await audit(user, 'CLIENTE_EDITADO', 'cliente', String(clientId), data.name);
    revalidatePath(`/clientes/${clientId}`);
    revalidatePath('/clientes');
    return { success: 'Cliente actualizado.' };
}

export async function createClientContact(clientId: number, _prevState: ClientFormState, formData: FormData): Promise<ClientFormState> {
    const user = await requireUser();

    const parsed = clientContactSchema.safeParse({
        name: formData.get('name'),
        role: formData.get('role') || null,
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    const data = parsed.data;

    await prisma.clientContact.create({
        data: {
            clientId,
            name: data.name,
            role: data.role || null,
            email: data.email || null,
            phone: data.phone || null,
        },
    });

    await audit(user, 'CONTACTO_CLIENTE_CREADO', 'cliente', String(clientId), data.name);
    revalidatePath(`/clientes/${clientId}`);
    return { success: 'Contacto agregado.' };
}

export async function updateClientContact(contactId: number, _prevState: ClientFormState, formData: FormData): Promise<ClientFormState> {
    const user = await requireUser();

    const parsed = clientContactSchema.safeParse({
        name: formData.get('name'),
        role: formData.get('role') || null,
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados.' };
    const data = parsed.data;

    const contact = await prisma.clientContact.findUnique({ where: { id: contactId } });
    if (!contact) return { error: 'El contacto no existe.' };

    await prisma.clientContact.update({
        where: { id: contactId },
        data: { name: data.name, role: data.role || null, email: data.email || null, phone: data.phone || null },
    });

    await audit(user, 'CONTACTO_CLIENTE_EDITADO', 'cliente', String(contact.clientId), data.name);
    revalidatePath(`/clientes/${contact.clientId}`);
    return { success: 'Contacto actualizado.' };
}

export async function deleteClientContact(contactId: number): Promise<ClientFormState> {
    const user = await requireUser();

    const contact = await prisma.clientContact.findUnique({ where: { id: contactId } });
    if (!contact) return { error: 'El contacto no existe.' };

    await prisma.clientContact.delete({ where: { id: contactId } });
    await audit(user, 'CONTACTO_CLIENTE_ELIMINADO', 'cliente', String(contact.clientId), contact.name);
    revalidatePath(`/clientes/${contact.clientId}`);
    return { success: 'Contacto eliminado.' };
}

/** Elimina un cliente y sus registros dependientes (solo administradores). */
export async function deleteClient(clientId: number): Promise<ClientFormState> {
    const admin = await requireAdmin();

    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { opportunities: { select: { id: true, code: true } } },
    });
    if (!client) return { error: 'El cliente no existe.' };

    const leadIds = client.opportunities.map((o) => o.id);
    await prisma.$transaction(async (tx) => {
        if (leadIds.length > 0) {
            await tx.leadActivity.deleteMany({ where: { leadId: { in: leadIds } } });
            await tx.quoteItem.deleteMany({ where: { quote: { opportunityId: { in: leadIds } } } });
            await tx.quote.deleteMany({ where: { opportunityId: { in: leadIds } } });
            await tx.certificate.updateMany({ where: { leadId: { in: leadIds } }, data: { leadId: null } });
            await tx.lead.deleteMany({ where: { id: { in: leadIds } } });
        }
        await tx.clientContact.deleteMany({ where: { clientId } });
        await tx.client.delete({ where: { id: clientId } });
    });

    await audit(admin, 'CLIENTE_ELIMINADO', 'cliente', String(clientId), client.name);
    revalidatePath('/clientes');
    revalidatePath('/leads');
    revalidatePath('/');
    return { success: `Cliente ${client.name} eliminado.` };
}

/** Eliminación masiva de clientes seleccionados (solo administradores). */
export async function bulkDeleteClients(clientIds: number[]): Promise<ClientFormState> {
    const admin = await requireAdmin();
    if (!clientIds.length) return { error: 'No se seleccionaron clientes.' };

    const clients = await prisma.client.findMany({
        where: { id: { in: clientIds } },
        include: { opportunities: { select: { id: true } } },
    });

    const allLeadIds = clients.flatMap((c) => c.opportunities.map((o) => o.id));

    await prisma.$transaction(async (tx) => {
        if (allLeadIds.length > 0) {
            await tx.leadActivity.deleteMany({ where: { leadId: { in: allLeadIds } } });
            await tx.quoteItem.deleteMany({ where: { quote: { opportunityId: { in: allLeadIds } } } });
            await tx.quote.deleteMany({ where: { opportunityId: { in: allLeadIds } } });
            await tx.certificate.updateMany({ where: { leadId: { in: allLeadIds } }, data: { leadId: null } });
            await tx.lead.deleteMany({ where: { id: { in: allLeadIds } } });
        }
        await tx.clientContact.deleteMany({ where: { clientId: { in: clientIds } } });
        await tx.client.deleteMany({ where: { id: { in: clientIds } } });
    });

    await audit(admin, 'CLIENTES_ELIMINADOS_MASIVO', 'cliente', `${clients.length} clientes`, clients.map((c) => c.name).join(', '));
    revalidatePath('/clientes');
    revalidatePath('/leads');
    revalidatePath('/');
    return { success: `${clients.length} clientes eliminados exitosamente.` };
}
