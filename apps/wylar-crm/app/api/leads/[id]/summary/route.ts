import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

/** Ficha resumida de una oportunidad, para mostrarla en el formulario de
 * cotización apenas se elige en el Combobox de búsqueda (que solo trae
 * id/código/nombre/empresa, no el detalle completo). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    await requireUser();
    const { id } = await params;
    const leadId = Number(id);
    if (!Number.isInteger(leadId)) return Response.json({ error: 'Oportunidad inválida.' }, { status: 400 });

    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { id: true, code: true, name: true, rut: true, email: true, phone: true, company: true, comuna: true },
    });
    if (!lead) return Response.json({ error: 'La oportunidad no existe.' }, { status: 404 });

    return Response.json({ lead });
}
