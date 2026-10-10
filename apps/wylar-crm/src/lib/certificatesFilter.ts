import 'server-only';
import type { Prisma } from '@prisma/client';

export interface CertificatesFilterParams {
    q?: string;
    status?: string;
    // Valor de completionText del tipo elegido (ver CertificateType) — el
    // tipo no es una columna propia de Certificate, es texto copiado al
    // emitir, así que se filtra por igualdad exacta de esa frase.
    type?: string;
}

/** Arma el `where` de Prisma según los filtros del listado de certificados.
 * El estado (Vigente/Vencido/Revocado/Sin vencimiento) no es una columna —
 * se deriva de expiryDate/revokedAt (ver certificateStatus en constants.ts),
 * así que el filtro traduce cada opción a la condición equivalente. */
export function buildCertificatesWhere({ q, status, type }: CertificatesFilterParams): Prisma.CertificateWhereInput {
    const now = new Date();
    let statusWhere: Prisma.CertificateWhereInput = {};
    if (status === 'REVOCADO') statusWhere = { revokedAt: { not: null } };
    else if (status === 'SIN_VENCIMIENTO') statusWhere = { revokedAt: null, expiryDate: null };
    else if (status === 'VIGENTE') statusWhere = { revokedAt: null, expiryDate: { gte: now } };
    else if (status === 'VENCIDO') statusWhere = { revokedAt: null, expiryDate: { lt: now } };

    return {
        ...statusWhere,
        ...(type ? { completionText: type } : {}),
        ...(q
            ? {
                  OR: [
                      { holderName: { contains: q, mode: 'insensitive' } },
                      { holderRut: { contains: q, mode: 'insensitive' } },
                      { code: { contains: q, mode: 'insensitive' } },
                      { certificationTitle: { contains: q, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };
}
