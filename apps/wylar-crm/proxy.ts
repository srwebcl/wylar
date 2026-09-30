import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Nota: en Next.js 16 el proxy (ex-middleware) siempre corre en runtime
// Node.js — no hace falta (ni se permite) declarar `runtime` aquí.

// Rutas públicas: login, salud, y las APIs públicas que consume el sitio
// wylar.cl (captura de leads, catálogo, validador de certificados — todas
// bajo app/api/public/*). Cada una hace su propia validación de origen
// (CORS), no depende de cookie de sesión, así que exigirle sesión acá las
// dejaría inalcanzables.
const PUBLIC_PREFIXES = ['/login', '/api/health', '/api/public'];

// Cualquier archivo estático de public/ (favicons, logos, robots.txt) es
// público por naturaleza — nada sensible vive ahí (lo que sube el CRM va a
// Vercel Blob, en otro dominio). Se excluye por extensión en vez de listar
// cada archivo a mano: la lista explícita anterior (favicon.svg,
// logo-wylar.webp) se desactualizó en cuanto se agregaron los favicons
// reales — /favicon.ico y cualquier imagen nueva bajo /images/ quedaban
// redirigidos a /login en vez de servirse.
const STATIC_FILE_PATTERN = /\.(?:ico|png|jpe?g|svg|webp|gif|txt|xml|webmanifest|css|js)$/i;

function isPublicPath(pathname: string) {
    if (pathname.startsWith('/_next/')) return true;
    if (STATIC_FILE_PATTERN.test(pathname)) return true;

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

export const config = {
    matcher: [
        // Todas las rutas salvo los internos de Next — el resto de las
        // excepciones (estáticos de public/, rutas públicas) se resuelven
        // todas en isPublicPath(), una sola fuente de verdad en vez de
        // mantener dos listas (acá y en isPublicPath) que se desincronizan
        // en cuanto se agrega un archivo nuevo — que es justo lo que pasó.
        '/((?!_next/static|_next/image).*)',
    ],
};
