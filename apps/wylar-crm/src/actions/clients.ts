'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin } from '@/lib/auth';
import { clientUpdateSchema, clientContactSchema } from '@/lib/validation';
import { normalizeRut } from '@/lib/rut';
import { audit } from '@/lib/audit';

export interface ClientFormState {
    error?: string;
    success?: string;
}

/** Edita la ficha de un cliente — cualquier usuario autenticado, igual que
 * editar una oportunidad hoy. No crea uno nuevo (eso lo hace
 * findOrCreateClient al dar de alta una oportunidad). */
export async function updateClient(clientId: number, _prevState: ClientFormState, formData: FormData): Promise<ClientFormState> {
    const user = await requireUser();

    const parsed = clientUpdateSchema.safeParse({
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
