'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from '@/lib/auth';
import { changePasswordSchema, loginSchema } from '@/lib/validation';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { audit } from '@/lib/audit';

// Hash de relleno: se compara aunque el correo no exista, para que la respuesta
// tarde lo mismo y no permita descubrir qué correos tienen cuenta.
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8m3Yw4qKk0fY0xLwqJ5Zc9c1P7jR2S';

export interface LoginState {
    error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
    const parsed = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    });
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }

    // Freno a la fuerza bruta: por IP+correo (8 intentos / 15 min) y por IP (40 / 15 min).
    const ip = clientIp(await headers());
    const emailKey = createHash('sha256').update(parsed.data.email.toLowerCase()).digest('hex').slice(0, 16);
    const [byAccount, byIp] = await Promise.all([rateLimit('login', `${ip}:${emailKey}`, 8, 900), rateLimit('login-ip', ip, 40, 900)]);
    if (!byAccount.ok || !byIp.ok) {
        return { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' };
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    const passwordOk = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.active || !passwordOk) return { error: 'Correo o contraseña incorrectos.' };

    await createSession(user.id);

    const next = formData.get('next');
    // Solo rutas internas: "//host" y "/\host" serían interpretadas como otro sitio.
    const destination = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/';
    redirect(destination);
}

export async function logoutAction() {
    await destroySession();
    redirect('/login');
}


export interface ChangePasswordState {
    error?: string;
    success?: string;
}

/** Cambio de contraseña del usuario que tiene la sesión abierta. */
export async function changePasswordAction(_prevState: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
    const user = await requireUser();

    const limit = await rateLimit('change-password', String(user.id), 5, 900);
    if (!limit.ok) return { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' };

    const parsed = changePasswordSchema.safeParse({
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword'),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

    if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
        return { error: 'La contraseña actual no es correcta.' };
    }

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
    await audit(user, 'CONTRASENA_CAMBIADA', 'usuario', user.id);
    return { success: 'Contraseña actualizada.' };
}
