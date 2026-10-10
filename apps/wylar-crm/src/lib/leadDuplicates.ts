import 'server-only';
import { prisma } from '@/lib/prisma';
import { PERSON_LEAD_TYPES, TERMINAL_STATUS_VALUES } from '@/lib/constants';

/**
 * Regla de negocio: una misma persona (Persona o Alumno Becado) no puede
 * tener dos prospectos ABIERTOS por el mismo interés de certificación —
 * pero sí puede tener varios por certificaciones distintas. Las empresas/
 * instituciones/OTEC no tienen esta restricción: cada negocio (aunque sea
 * la misma certificación, para otra sede o fecha) es su propio prospecto.
 *
 * "La misma persona" se identifica por correo O teléfono (no exige los
 * dos), y "abierto" significa que su estado no es terminal (Cerrado o
 * Desistido) — un prospecto ya cerrado/desistido no bloquea uno nuevo.
 */
export async function findDuplicateOpenLead({
    type,
    email,
    phone,
    certificationInterest,
}: {
    type: string;
    email: string;
    phone: string;
    certificationInterest?: string | null;
}) {
    if (!PERSON_LEAD_TYPES.includes(type)) return null;
    if (!certificationInterest) return null;

    return prisma.lead.findFirst({
        where: {
            status: { notIn: [...TERMINAL_STATUS_VALUES] },
            certificationInterest,
            OR: [{ email }, { phone }],
        },
        orderBy: { createdAt: 'desc' },
    });
}
