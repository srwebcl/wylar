// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'hybrid',
  integrations: [react()],
  adapter: vercel(),
  security: {
    // CSP nativa de Astro 7: calcula los hashes de sus propios scripts/estilos
    // de hidratación en cada build, así que no se rompe con cada actualización
    // de Astro (a diferencia de hashear a mano). Solo funciona en build/preview,
    // no en `astro dev` (limitación documentada de Astro).
    csp: {
      directives: [
        "default-src 'self'",
        // Imágenes: propias + subidas al catálogo/hero desde el CRM (Vercel Blob)
        // + los 2 fondos de /otec y /instituciones que aún son de Unsplash + la
        // textura del header.
        "img-src 'self' data: https://*.public.blob.vercel-storage.com https://images.unsplash.com https://www.transparenttextures.com",
        // Los formularios (ContactForm, SidebarForm, ContactModal, Validador) llaman
        // por fetch() al CRM, no a wylar.cl — sin esto se bloquea todo el sitio.
        "connect-src 'self' https://crm.wylar.cl https://wylar-crm.vercel.app",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
      ],
      styleDirective: {
        resources: [
          "'self'",
          // El slider del home pinta la imagen de cada slide (dato del CRM, no fijo
          // en el build) como style="background-image:url(...)" — no se puede
          // hashear porque cambia según el contenido. Se limita a los atributos
          // style="", no afecta <style>/<link> (kind: "attribute").
          { resource: "'unsafe-inline'", kind: 'attribute' },
          // El propio runtime de hidratación de Astro (para los islands de React)
          // inyecta un <style> por JS en tiempo de cliente cuyo hash no siempre
          // coincide con el que Astro calculó en el build — probado en las 9
          // páginas del sitio: con esto en 'attribute' solamente, el home rompía
          // el carrusel de logos (violación real en style-src-elem). Se relaja
          // solo este sub-directivo (kind: "element", cubre <style>/CSS que Astro
          // o React inyectan) — script-src, la parte que realmente frena XSS,
          // queda 100% estricta con hashes (0 violaciones en las 9 páginas).
          //
          // 'self' hay que repetirlo aquí también (kind: "element"): al definir
          // cualquier recurso con kind "element", Astro arma un style-src-elem
          // aparte que YA NO hereda el 'self' del directivo general — sin este,
          // el <link rel="stylesheet"> propio del sitio queda bloqueado (violación
          // real, probada: bloqueaba Layout.*.css en las 9 páginas).
          { resource: "'self'", kind: 'element' },
          { resource: "'unsafe-inline'", kind: 'element' },
        ],
      },
    },
  },
});
