import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Nota: en Next.js 16 el proxy (ex-middleware) siempre corre en runtime
// Node.js — no hace falta (ni se permite) declarar `runtime` aquí.

// Rutas públicas: login, salud, y la API pública que consume el sitio
// wylar.cl para crear leads (Módulo de Captura de Oportunidades) — esa
// ruta hace su propia validación de origen (CORS), no depende de cookie
// de sesión, así que exigirle sesión acá la dejaría inalcanzable.
const PUBLIC_PREFIXES = ['/login', '/api/health', '/api/public'];

const PUBLIC_STATIC_FILES = ['/favicon.svg', '/logo-wylar.webp'];

function isPublicPath(pathname: string) {
    if (pathname.startsWith('/_next/')) return true;
    if (PUBLIC_STATIC_FILES.includes(pathname)) return true;

    return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Nota: el proxy no tiene acceso al contexto de request de next/headers, así
// que la cookie se lee vía `request.cookies` y se verifica solo la
// firma/expiración del JWT (rápido). La verificación autoritativa contra la
// base de datos (el usuario sigue existiendo/activo, su rol vigente) ocurre
// en requireUser() dentro de cada página — esta es solo la primera barrera.
async function hasValidSession(request: NextRequest): Promise<boolean> {
    const token = request.cookies.get('session')?.value;
    if (!token) return false;

    const secret = process.env.SESSION_SECRET;
    if (!secret) return false;

    try {
        await jwtVerify(token, new TextEncoder().encode(secret));
        return true;
    } catch {
        return false;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    if (!(await hasValidSession(request))) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const proxyConfig = {
    matcher: [
        // Todas las rutas salvo assets internos de Next.
        '/((?!_next/static|_next/image|favicon.svg).*)',
    ],
};
