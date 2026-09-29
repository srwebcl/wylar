# Wylar CRM

Plataforma interna para administrar los leads (prospectos) de Wylar y automatizar su captura desde el sitio público **wylar.cl**, sin digitación manual del equipo comercial.

Stack: **Next.js 16** (App Router) + **TypeScript** + **Prisma** (PostgreSQL/Neon) + **Tailwind CSS 4**. Pensado para desplegarse en **Vercel**.

Es un proyecto separado del sitio [wylar](../wylar) (Astro 7, renderizado en servidor con caché de CDN) — se comunican por HTTP: el sitio público envía leads a la API pública de este proyecto (ver [Conectar wylar.cl](#conectar-wylarcl)).

## Qué incluye (y qué no, todavía)

| Módulo del brief | Estado |
|---|---|
| 2. Captura de Oportunidades — sincronización web→CRM automática, rastreo de origen | ✅ Implementado (`app/api/public/leads`) |
| 3. Gestión Comercial — ficha única, tablero de estados (embudo), asignación de responsables | ✅ Implementado (`/`, `/leads`, `/leads/[id]`) |
| 4. Seguimiento y Control — bitácora de gestiones, auditoría de tiempos de respuesta | ✅ Implementado (ficha del lead) |
| 5. Dashboard — métricas y gráficos del embudo, orígenes, catálogo y certificados | ✅ Implementado (`/dashboard`) |
| 6. Catálogo — administración de los perfiles/certificaciones que se exhiben en wylar.cl | ✅ Implementado (`/catalogo`, `app/api/public/catalog`) |
| 7. Certificados — emisión (con PDF descargable) y validador público por RUT/código | ✅ Implementado (`/certificados`, `app/api/public/certificates/*`) |
| 1. Filtro y Atención Automática (WhatsApp) — menú 24/7, derivación inteligente | ⏳ No implementado todavía |

El módulo de WhatsApp quedó pendiente a propósito: requiere una cuenta de **WhatsApp Business API** (Meta Cloud API o Twilio) con número verificado, que no se puede provisionar desde acá. El modelo de datos ya está listo para recibirlo (`Lead.source = "WHATSAPP"` ya existe como canal, ver [Fase 2: WhatsApp](#fase-2-módulo-whatsapp-pendiente) más abajo con el punto de integración sugerido).

## Requisitos

- Node.js 22 (`nvm use` lee el `.nvmrc`; también funciona con `^20.19 || >=22.12`)
- Una base de datos PostgreSQL accesible (Neon — ver despliegue en Vercel más abajo)

## Desarrollo local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar `.env.example` a `.env` y completar `DATABASE_URL` (una base Postgres real — ver nota abajo) y `SESSION_SECRET` (`openssl rand -base64 32`).
3. Aplicar el schema y cargar datos de ejemplo:
   ```bash
   npm run db:migrate   # crea las tablas
   npm run db:seed      # crea usuarios y 4 leads de ejemplo
   ```
   El seed crea usuarios de ejemplo con la contraseña de `SEED_PASSWORD` (por defecto `1234`, **solo para desarrollo**; las nuevas contraseñas exigen 12 caracteres). Usuario admin: `admin@wylar.cl`. En producción cambia la contraseña desde **Mi cuenta** (`/cuenta`).
4. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   App en `http://localhost:3000`.

**Nota sobre la base de datos en desarrollo:** este proyecto usa el driver serverless de Neon (`@neondatabase/serverless` + `@prisma/adapter-neon`), que habla el protocolo propio de Neon por WebSocket — **no funciona contra un Postgres local corriente** (a diferencia del CLI de migraciones, que sí puede apuntar a cualquier Postgres). Lo más simple para desarrollar es usar directamente una base Neon real desde el día uno (gratis, ver [neon.tech](https://neon.tech) o provisionarla junto con Vercel more abajo) y apuntar `DATABASE_URL` a ella también en local.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build |
| `npm run db:migrate` | Aplica migraciones en desarrollo |
| `npm run db:migrate:deploy` | Aplica migraciones en producción |
| `npm run db:seed` | Carga usuarios y leads de ejemplo |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar la base de datos |
| `npm run lint` | Lint con oxlint |
| `npm test` | Pruebas unitarias (Vitest) de las reglas puras: slug, RUT, estados de certificado, sanitizado de HTML, validaciones… |
| `npm run db:backup` | Respaldo de leads, usuarios, perfiles, certificados y banners a JSON en `backups/` (ignorado por git; contiene datos personales) |

## Despliegue en Vercel

1. **Base de datos**: Marketplace → Neon Postgres (`vercel integration add neon`) — provisiona `DATABASE_URL` automáticamente.
2. **Variables propias** (`vercel env add <nombre> production`):
   - `SESSION_SECRET` — secreto para firmar la cookie de sesión (`openssl rand -base64 32`).
   - `PUBLIC_FORM_ORIGINS` — dominios permitidos para que wylar.cl pueda llamar a la API pública, ej. `https://wylar.cl,https://www.wylar.cl`.
   - `SEED_PASSWORD` — opcional, solo la usa `npm run db:seed`.
   - Ver `.env.example` para la lista completa.
3. Migrar y sembrar contra la BD de Vercel: `vercel env pull` (trae las variables reales a `.env.local`) y luego `npm run db:migrate:deploy` + `npm run db:seed` (o crear el primer admin manualmente, ver abajo).
4. Deploy: `vercel --prod`, o hacer push a `main` una vez conectado el repo de GitHub al proyecto (`vercel git connect`).
5. **Cambia la contraseña del usuario admin de ejemplo** apenas tengas acceso, desde **Mi cuenta** (`/cuenta`, ícono de llave en la barra lateral).

## Conectar wylar.cl

El sitio público (proyecto [`wylar`](../wylar), Astro) ya está conectado a este CRM: `src/lib/crm.js` en ese proyecto define `submitLead()`, usado por `ContactForm.jsx` y por el modal/formulario lateral de cada ficha de certificación (`SidebarForm.astro`, `ContactModal.astro`). Cada envío:

1. Detecta el canal de origen (Facebook, Instagram, WhatsApp, Web directo, Otro) a partir de `utm_source`/`utm_medium` en la URL o el `document.referrer`.
2. Hace `POST` a `PUBLIC_CRM_API_URL` (definida en el `.env` del proyecto `wylar`) con los datos del formulario + el origen detectado.

Para que funcione en producción, quedan dos pasos una vez desplegado este proyecto:

1. En **wylar-crm** (este proyecto): definir `PUBLIC_FORM_ORIGINS` con el dominio real de wylar.cl (ver arriba).
2. En **wylar** (el sitio Astro): definir `PUBLIC_CRM_API_URL="https://<tu-deploy>.vercel.app/api/public/leads"` en su `.env`/variables de entorno de build, y volver a desplegar el sitio.

Mientras esa variable no esté configurada, los formularios apuntan a un dominio de ejemplo (`https://crm.wylar.cl/...`) que no existe — los envíos fallarán mostrando el mensaje de error ya contemplado en la UI (no rompen la página).

### Catálogo y certificados (`/catalogo`, `/validador`)

Además de la captura de leads, wylar.cl puede consumir dos APIs públicas más (mismo `PUBLIC_FORM_ORIGINS`, sin variable adicional):

- `GET /api/public/catalog` (o `?slug=<slug>` para un solo perfil) — perfiles activos del catálogo, con sus secciones y FAQ, para pintar `/catalogo` y `/perfil/[slug]` en vez de usar el `src/data/perfiles.js` hardcodeado que tiene hoy.
- `GET /api/public/certificates/validate?code=<código>` (o `?rut=<rut>`) — para `/validador`: devuelve los certificados que coincidan (puede haber más de uno por RUT), con estado Vigente/Vencido calculado al momento de la consulta.
- `GET /api/public/certificates/<código>/pdf` — el PDF descargable del certificado (se genera al vuelo, no se persiste ningún archivo).

## Fase 2: Módulo WhatsApp (pendiente)

Cuando exista la cuenta de WhatsApp Business API, el punto de integración natural es:

- Un webhook nuevo, `app/api/whatsapp/webhook/route.ts` (agregarlo a `PUBLIC_PREFIXES` en `proxy.ts`), que reciba los mensajes entrantes de Meta Cloud API / Twilio.
- Reutilizar `createLeadFromPublicForm()` (`src/actions/leads.ts`) para crear el lead cuando el bot detecte intención real de cotizar/certificarse — mismo modelo de datos, con `source: "WHATSAPP"`.
- El menú de autoconsulta 24/7 (preguntas frecuentes) puede vivir como reglas simples en ese mismo webhook, sin necesidad de un LLM — solo se vuelve necesario si se quiere lenguaje más libre.

## Estructura

- `app/(app)/` — páginas internas protegidas: `/` (tablero/embudo), `/leads` (listado y filtros), `/leads/[id]` (ficha única + bitácora), `/dashboard` (métricas), `/catalogo` (CRUD de perfiles), `/certificados` (emisión), `/equipo` (solo administradores).
- `app/api/public/` — APIs públicas (sin sesión) que consume wylar.cl: `leads`, `catalog`, `certificates/validate`, `certificates/[code]/pdf`.
- `app/login/` — login del equipo.
- `src/actions/` — Server Actions (leads, catálogo, certificados, usuarios, sesión).
- `src/lib/` — Prisma client, autenticación (cookie firmada + bcrypt), catálogos/constantes, filtros de búsqueda, `catalogSpec.ts` (especificación de secciones del catálogo por plantilla), `publicApi.ts` (CORS compartido).
- `src/components/` — UI (tablero kanban, ficha del lead, tabla de prospectos, gestión de equipo, dashboard, editor de perfiles del catálogo, gestión de certificados).
- `prisma/schema.prisma` — modelo de datos. `prisma/seed.ts` — datos de ejemplo.
- `proxy.ts` — protección de rutas (equivalente al histórico `middleware.ts`).

## Notas de seguridad

- Contraseñas guardadas hasheadas (bcrypt), mínimo 12 caracteres, con pantalla **Mi cuenta** para cambiarlas. El login compara el hash aunque el correo no exista (misma demora) y se bloquea tras 8 intentos fallidos por IP+correo cada 15 minutos.
- Sesión vía cookie `httpOnly` firmada (JWT). Ningún componente cliente recibe `passwordHash` (`SafeUser`, `omit`).
- **Límite de peticiones** (`src/lib/rateLimit.ts`, tabla `rate_limits`): login, leads (6 cada 10 min por IP), validador (30/min), PDF (20/min) y cambio de contraseña.
- La API pública valida origen (CORS restringido a `PUBLIC_FORM_ORIGINS`; recuerda que CORS no frena a bots — para eso está el límite), incluye honeypot anti-spam y solo puede **crear** leads.
- El HTML del catálogo (plantilla ESTANDAR) se **sanea en el servidor** (`sanitize-html`, lista blanca) antes de guardarse; `ctaHref` e imágenes del banner solo aceptan rutas internas o `https://`.
- Acciones destructivas solo para ADMIN: eliminar perfiles y banners, revocar certificados. Los certificados **no se borran**: se revocan (el validador los muestra como "Revocado" y el PDF deja de estar disponible). Todo queda en **Auditoría** (`/auditoria`, solo ADMIN).
- La subida de imágenes verifica la firma real del archivo (no solo el tipo que declara el navegador).
- Cabeceras de seguridad (`next.config.ts`): `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. `robots.txt` y `noindex` para que el panel no aparezca en buscadores.
- Un usuario desactivado (`/equipo`) pierde el acceso de inmediato, sin esperar a que expire su sesión.
- El validador de certificados (`/api/public/certificates/validate`) expone el RUT completo del titular — decisión de producto (el validador busca por RUT o código). Se mitiga con búsqueda indexada, límite de consultas y respuesta acotada a 20 resultados. Evalúa con asesoría legal si conviene enmascararlo.
- El sitio consulta catálogo y banners con caché de CDN (30 s) y las páginas del sitio se cachean 60 s: los cambios hechos aquí se ven en 1–3 minutos, sin desplegar.
<!-- redeploy: PUBLIC_FORM_ORIGINS ahora incluye wylar.cl -->
