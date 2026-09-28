import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const ACTION_LABELS: Record<string, string> = {
    CERTIFICADO_EMITIDO: 'Certificado emitido',
    CERTIFICADO_REVOCADO: 'Certificado revocado',
    PERFIL_CREADO: 'Perfil creado',
    PERFIL_ACTUALIZADO: 'Perfil actualizado',
    PERFIL_ELIMINADO: 'Perfil eliminado',
    BANNER_ELIMINADO: 'Banner eliminado',
    USUARIO_CREADO: 'Usuario creado',
    USUARIO_ACTIVADO: 'Usuario activado',
    USUARIO_DESACTIVADO: 'Usuario desactivado',
    CONTRASENA_CAMBIADA: 'Contraseña cambiada',
};

export default async function AuditoriaPage() {
    await requireAdmin();
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Auditoría</h1>
                <p className="text-slate-500 text-sm mt-1">Registro de acciones sensibles: quién hizo qué y cuándo (últimas 200).</p>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                            <th className="px-5 py-3">Fecha</th>
                            <th className="px-5 py-3">Usuario</th>
                            <th className="px-5 py-3">Acción</th>
                            <th className="px-5 py-3">Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="border-b border-slate-50 last:border-0">
                                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{log.createdAt.toLocaleString('es-CL', { timeZone: 'America/Santiago' })}</td>
                                <td className="px-5 py-3 font-medium text-slate-800">{log.userName}</td>
                                <td className="px-5 py-3 text-slate-700">{ACTION_LABELS[log.action] ?? log.action}</td>
                                <td className="px-5 py-3 text-slate-500">
                                    {log.entityId && <span className="font-mono text-xs text-slate-600">{log.entityId}</span>}
                                    {log.detail && <span className="ml-2">{log.detail}</span>}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                                    Aún no hay acciones registradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
