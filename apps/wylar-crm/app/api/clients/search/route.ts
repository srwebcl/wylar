import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { buildClientsWhere } from '@/lib/clientsFilter';

/** Búsqueda liviana de clientes para el Combobox remoto — nunca trae el
 * listado completo, solo los primeros resultados que calzan con `q`. */
export async function GET(request: Request) {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';

    const clients = await prisma.client.findMany({
        where: q ? buildClientsWhere({ q }) : {},
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, name: true, company: true, rut: true },
    });

    return Response.json({
        options: clients.map((c) => ({ id: c.id, label: c.name, sublabel: c.company ?? c.rut ?? undefined })),
    });
}
