import 'server-only';
import type { Prisma } from '@prisma/client';
import { normalizeRut } from '@/lib/rut';

export interface LeadsFilterParams {
    q?: string;
    status?: string;
    source?: string;
    assignedToId?: string;
    categoryId?: string;
    productId?: string;
    comuna?: string;
    from?: string;
    to?: string;
}

/** Arma el `where` de Prisma según los filtros del listado de oportunidades.
 * La búsqueda es amplia a propósito: cubre identidad (nombre, RUT, correo,
 * teléfono), el producto de interés y su tipo de contacto, para que una
 * sola barra sirva para encontrar una oportunidad sin saber de antemano en
 * qué campo quedó el dato. */
export function buildLeadsWhere({ q, status, source, assignedToId, categoryId, productId, comuna, from, to }: LeadsFilterParams): Prisma.LeadWhereInput {
    const qRutNorm = q ? normalizeRut(q) : '';
    return {
        ...(status ? { status } : {}),
        ...(source ? { source } : {}),
        ...(assignedToId === 'sin-asignar' ? { assignedToId: null } : assignedToId ? { assignedToId: Number.isInteger(Number(assignedToId)) ? Number(assignedToId) : -1 } : {}),
        ...(productId ? { productId: Number(productId) } : {}),
        ...(categoryId ? { product: { categoryId: Number(categoryId) } } : {}),
        ...(comuna ? { comuna: { contains: comuna, mode: 'insensitive' } } : {}),
        ...(from || to
            ? {
                  createdAt: {
                      ...(from ? { gte: new Date(from) } : {}),
                      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
                  },
              }
            : {}),
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
                      { comuna: { contains: q, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };
}
