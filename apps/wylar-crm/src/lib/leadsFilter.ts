import 'server-only';
import type { Prisma } from '@prisma/client';
import { normalizeRut } from '@/lib/rut';

export interface LeadsFilterParams {
    q?: string;
    status?: string;
    source?: string;
    assignedToId?: string;
}

/** Arma el `where` de Prisma según los filtros del listado de prospectos.
 * La búsqueda es amplia a propósito: cubre identidad (nombre, RUT, correo,
 * teléfono), la certificación que le interesa y su tipo de contacto, para
 * que una sola barra sirva para encontrar un prospecto sin saber de
 * antemano en qué campo quedó el dato. */
export function buildLeadsWhere({ q, status, source, assignedToId }: LeadsFilterParams): Prisma.LeadWhereInput {
    const qRutNorm = q ? normalizeRut(q) : '';
    return {
        ...(status ? { status } : {}),
        ...(source ? { source } : {}),
        ...(assignedToId === 'sin-asignar' ? { assignedToId: null } : assignedToId ? { assignedToId: Number.isInteger(Number(assignedToId)) ? Number(assignedToId) : -1 } : {}),
        ...(q
            ? {
                  OR: [
                      { name: { contains: q, mode: 'insensitive' } },
                      { email: { contains: q, mode: 'insensitive' } },
                      { phone: { contains: q, mode: 'insensitive' } },
                      { code: { contains: q, mode: 'insensitive' } },
                      { company: { contains: q, mode: 'insensitive' } },
                      { rut: { contains: q, mode: 'insensitive' } },
                      ...(qRutNorm ? [{ rutNorm: { contains: qRutNorm, mode: 'insensitive' as const } }] : []),
                      { certificationInterest: { contains: q, mode: 'insensitive' } },
                      { type: { contains: q, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };
}
