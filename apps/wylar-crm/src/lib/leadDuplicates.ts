import 'server-only';
import { prisma } from '@/lib/prisma';
import { PERSON_LEAD_TYPES, TERMINAL_STATUS_VALUES } from '@/lib/constants';

/**
 * Regla de negocio: una misma persona (Persona o Alumno Becado) no puede
 * tener dos oportunidades ABIERTAS por el mismo producto — pero sí puede
 * tener varias por productos distintos. Las empresas/instituciones/OTEC no
 * tienen esta restricción dura: cada negocio (aunque sea el mismo producto,
 * para otra sede o fecha) es su propia oportunidad — en su caso solo se
 * advierte (ver findSimilarOpenOpportunity), no se bloquea.
 *
 * "La misma persona" se identifica por correo O teléfono O RUT (no exige
 * todos), y "abierta" significa que su estado no es terminal (Cerrado o
 * Desistido) — una oportunidad ya cerrada/desistida no bloquea una nueva.
 */
export async function findDuplicateOpenLead({
    type,
    email,
    phone,
    rut,
    productId,
}: {
    type: string;
    email: string;
    phone: string;
    rut?: string | null;
    productId: number;
}) {
    if (!PERSON_LEAD_TYPES.includes(type)) return null;

    return prisma.lead.findFirst({
        where: {
            status: { notIn: [...TERMINAL_STATUS_VALUES] },
            productId,
            OR: [{ email }, { phone }, ...(rut ? [{ rut }] : [])],
        },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Mismo criterio que findDuplicateOpenLead pero para empresas/OTEC/
 * instituciones: no bloquea, solo permite avisar en el formulario que ya
 * existe una oportunidad similar antes de confirmar la creación.
 */
export async function findSimilarOpenOpportunity({
    type,
    email,
    phone,
    rut,
    productId,
}: {
    type: string;
    email: string;
    phone: string;
    rut?: string | null;
    productId: number;
}) {
    if (PERSON_LEAD_TYPES.includes(type)) return null;

    return prisma.lead.findFirst({
        where: {
            status: { notIn: [...TERMINAL_STATUS_VALUES] },
            productId,
            OR: [{ email }, { phone }, ...(rut ? [{ rut }] : [])],
        },
        orderBy: { createdAt: 'desc' },
    });
}
