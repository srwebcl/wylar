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

## Notas

- El formulario de contacto (`ContactForm.jsx`) todavía no está conectado a un backend/servicio de envío real — al enviarlo solo muestra una confirmación en pantalla. Falta integrar un proveedor (p. ej. un endpoint propio, Formspree, Resend, etc.) antes de production.
- No hay variables de entorno ni claves de API en uso actualmente.
