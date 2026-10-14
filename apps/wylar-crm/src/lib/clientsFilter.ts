import 'server-only';
import type { Prisma } from '@prisma/client';
import { normalizeRut } from '@/lib/rut';

export interface ClientsFilterParams {
    q?: string;
    type?: string;
}

export function buildClientsWhere({ q, type }: ClientsFilterParams): Prisma.ClientWhereInput {
    const qRutNorm = q ? normalizeRut(q) : '';
    return {
        ...(type ? { type } : {}),
        ...(q
            ? {
                  OR: [
                      { name: { contains: q, mode: 'insensitive' } },
                      { email: { contains: q, mode: 'insensitive' } },
                      { phone: { contains: q, mode: 'insensitive' } },
                      { company: { contains: q, mode: 'insensitive' } },
                      { rut: { contains: q, mode: 'insensitive' } },
                      ...(qRutNorm ? [{ rutNorm: { contains: qRutNorm, mode: 'insensitive' as const } }] : []),
                  ],
              }
            : {}),
    };
}
