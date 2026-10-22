import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { buildLeadsWhere } from '@/lib/leadsFilter';

/** Búsqueda liviana de oportunidades para el Combobox remoto (ej. al elegir
 * la oportunidad de una cotización) — nunca trae el listado completo, solo
 * los primeros resultados que calzan con `q`. */
export async function GET(request: Request) {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';

    const leads = await prisma.lead.findMany({
        where: q ? buildLeadsWhere({ q }) : {},
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, code: true, name: true, company: true },
    });

    return Response.json({
        options: leads.map((l) => ({ id: l.id, label: `${l.code} — ${l.name}`, sublabel: l.company ?? undefined })),
    });
}
