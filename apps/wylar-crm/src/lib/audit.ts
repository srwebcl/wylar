import 'server-only';
import { prisma } from './prisma';

/**
 * Registra una acción sensible (quién, qué, sobre qué). Nunca interrumpe la
 * acción principal: si el registro falla solo se deja constancia en consola.
 */
export async function audit(user: { id: number; name: string } | null, action: string, entity: string, entityId?: string | number | null, detail?: string) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: user?.id ?? null,
                userName: user?.name ?? 'Sistema',
                action,
                entity,
                entityId: entityId != null ? String(entityId) : null,
                detail: detail?.slice(0, 1000) ?? null,
            },
        });
    } catch (error) {
        console.error('[audit] no se pudo registrar:', action, error);
    }
}
