# Wylar — Monorepo

Repositorio único que agrupa el sitio público de Wylar y su CRM interno. Cada app vive en su propia carpeta bajo `apps/`, con su propio `package.json`, su propio `node_modules` y su propio proyecto/deploy en Vercel — el monorepo solo las agrupa en un mismo historial de Git; no comparten build ni runtime.

## Apps

| Carpeta | Qué es | Stack | Deploy |
|---|---|---|---|
| [`apps/wylar`](apps/wylar) | Sitio público (wylar.cl) | Astro + React + Tailwind, 100% estático | `wylar.vercel.app` |
| [`apps/wylar-crm`](apps/wylar-crm) | CRM interno (leads, embudo, catálogo, certificados) | Next.js + Prisma/Postgres (Neon) + Tailwind | `wylar-crm.vercel.app` |

Por qué están en apps separadas y no fusionadas en una sola app: `apps/wylar` es un sitio estático sin servidor ni base de datos; `apps/wylar-crm` necesita sesión, base de datos y rutas protegidas. Son dos runtimes distintos — lo único que cambia al pasar a monorepo es que ahora comparten repositorio e historial; cada una se sigue desplegando por separado.

## Cómo se conectan

El sitio le envía los leads capturados en sus formularios al CRM vía su API pública:

- `apps/wylar/src/lib/crm.js` → hace `POST` a `PUBLIC_CRM_API_URL` (env var de `apps/wylar`, hoy `https://wylar-crm.vercel.app/api/public/leads`).
- `apps/wylar-crm/app/api/public/leads/route.ts` → valida el origen contra `PUBLIC_FORM_ORIGINS` (env var de `apps/wylar-crm`, hoy incluye `https://wylar.vercel.app`).

Si alguna vez cambia el dominio de alguno de los dos, hay que actualizar la variable correspondiente en el otro proyecto en Vercel.

## Desarrollo local

Cada app se instala y corre de forma independiente:

```bash
cd apps/wylar && npm install && npm run dev       # http://localhost:4321
cd apps/wylar-crm && npm install && npm run dev   # http://localhost:3000
```

Ver el README de cada carpeta para el detalle de variables de entorno, migraciones de base de datos, etc.

## Deploy

Cada app tiene su propio proyecto de Vercel, ya vinculado (`.vercel/project.json` dentro de cada carpeta — no versionado). Se despliega desde dentro de cada carpeta:

```bash
cd apps/wylar && vercel --prod
cd apps/wylar-crm && vercel --prod
```

(No están conectados a Git en Vercel — los deploys son manuales vía CLI, no ocurren automáticamente al hacer push a este repo.)
