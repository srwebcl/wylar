# Wylar — Sitio Web

Sitio institucional de **Wylar**, Centro de Evaluación y Certificación de Competencias Laborales acreditado por ChileValora.

Construido con [Astro](https://astro.build) + islas de [React](https://react.dev) para los componentes interactivos, y [Tailwind CSS](https://tailwindcss.com) para los estilos.

## Estructura del proyecto

```text
/
├── public/
│   ├── images/              # Fotografías e imágenes usadas por el sitio
│   └── logos-clientes/      # Logos de clientes/instituciones (trust strip)
├── src/
│   ├── components/          # Componentes .astro y .jsx (Header, Footer, Hero, formularios, etc.)
│   ├── data/
│   │   └── perfiles.js      # Catálogo de perfiles/certificaciones (fuente única de datos)
│   ├── layouts/
│   │   └── Layout.astro     # Layout base (Header + Footer + <head>)
│   ├── pages/                # Rutas del sitio (una página por archivo/carpeta)
│   │   ├── index.astro       # Home
│   │   ├── personas.astro    # Portal Personas
│   │   ├── instituciones.astro  # Portal Instituciones de Educación
│   │   ├── empresas.astro    # Portal Empresas
│   │   ├── catalogo.astro    # Catálogo completo de certificaciones
│   │   ├── perfil/[id].astro # Ficha de un perfil/certificación (ruta dinámica)
│   │   └── ...
│   └── styles/global.css
├── astro.config.mjs           # Integraciones (React, Tailwind) + redirects
└── package.json
```

`base/` (carpeta local, no versionada) contiene material fuente de diseño — logos en `.ai`/`.pdf`, documentos internos y prototipos. No se sube al repositorio (ver `.gitignore`); vive solo en el entorno de trabajo local.

## Comandos

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Levanta el servidor de desarrollo en `localhost:4321` |
| `npm run build` | Genera el sitio estático de producción en `./dist/` |
| `npm run preview` | Sirve localmente el build de producción, antes de desplegar |

## Rutas y redirects

Las 3 páginas de portal (`/personas`, `/instituciones`, `/empresas`) comparten una misma estructura estandarizada: Hero → Métricas → Cómo Funciona → Beneficios → Catálogo de Perfiles → Formulario de contacto.

`/otec` redirige de forma permanente a `/instituciones` (configurado en `astro.config.mjs`) para no romper enlaces antiguos.

## CRM (captura de leads)

Los formularios del sitio (`ContactForm.jsx`, y el modal/formulario lateral de cada ficha de certificación) envían los leads directamente al [Wylar CRM](../wylar-crm) — un proyecto Next.js aparte, ver `src/lib/crm.js`. No hay digitación manual: cada envío crea la ficha del prospecto sola, con su canal de origen detectado automáticamente (Facebook, Instagram, WhatsApp, Web u Otro).

Variable de entorno necesaria (`.env`, o configurada en el hosting de este sitio):

```
PUBLIC_CRM_API_URL="https://<tu-deploy-de-wylar-crm>.vercel.app/api/public/leads"
```

Sin esta variable, los formularios apuntan a un dominio de ejemplo y el envío falla mostrando un mensaje de error en pantalla (no rompe la página). Ver `wylar-crm/README.md`, sección "Conectar wylar.cl", para el resto de la configuración (CORS del lado del CRM, etc.).

## Notas

- No hay más variables de entorno ni claves de API en uso, aparte de `PUBLIC_CRM_API_URL` arriba.
