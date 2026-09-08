import 'server-only';
import type { Prisma } from '@prisma/client';

export interface LeadsFilterParams {
    q?: string;
    status?: string;
    source?: string;
    assignedToId?: string;
}

/** Arma el `where` de Prisma según los filtros del listado de prospectos. */
export function buildLeadsWhere({ q, status, source, assignedToId }: LeadsFilterParams): Prisma.LeadWhereInput {
    return {
        ...(status ? { status } : {}),
        ...(source ? { source } : {}),
        ...(assignedToId === 'sin-asignar' ? { assignedToId: null } : assignedToId ? { assignedToId: Number(assignedToId) } : {}),
        ...(q
            ? {
                  OR: [
                      { name: { contains: q, mode: 'insensitive' } },
                      { email: { contains: q, mode: 'insensitive' } },
                      { phone: { contains: q, mode: 'insensitive' } },
                      { code: { contains: q, mode: 'insensitive' } },
                      { company: { contains: q, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };
}
