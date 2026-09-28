import type { NextConfig } from 'next';

// Cabeceras de seguridad para todo el CRM. frame-ancestors impide que otra web
// muestre el panel dentro de un <iframe> (clickjacking).
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  // Standalone output: server autocontenido para autoalojar en un servidor
  // propio. En Vercel se omite — arma su propio output y no lo necesita
  // (`process.env.VERCEL` está siempre definido ahí en build time).
  output: process.env.VERCEL ? undefined : 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
