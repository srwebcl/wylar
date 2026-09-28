import type { User } from '@prisma/client';

// Usuario sin el hash de contraseña: es lo único que puede viajar a componentes
// cliente (todo lo que se pasa como prop a un 'use client' llega al navegador).
export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
}
