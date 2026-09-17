# Informe: consistencia de copy en el Home tras el cambio de nomenclatura

Fecha: 2026-08-31
Alcance: `src/pages/index.astro` + componentes que renderiza (`Header`, `Portales`, `ContactForm`, `Footer`) tras el cambio de "Personas Naturales / OTEC e Instituciones de Educación / Empresas e Instituciones" → **"Trabajadores / Instituciones de Educación / Empresas"**.

## Resumen

El cambio se aplicó de forma parcial. `index.astro` y `Portales.jsx` ya usan la nomenclatura nueva, pero **Header.jsx no se actualizó**, y dos CTA del Hero apuntan a un destino que no corresponde con su texto actual (esto último es independiente del rename, pero lo detecté al trazar cada link). Detalle abajo, de mayor a menor impacto.

---

## 1. CTA del Hero desalineados con su destino (bug de copy, prioridad alta)

[index.astro:81-97](../src/pages/index.astro#L81-L97)

| Texto actual | Ícono | href | Problema |
|---|---|---|---|
| "Quiero Certificarme" | `Building2` (empresa) | `/empresas` | Un trabajador que lee "Quiero certificarme" (1ª persona, intención individual) espera llegar al portal de **personas**, no al de empresas. Antes de tu cambio el botón decía "Servicios para Empresas" y el link calzaba; al renombrar el texto quedó desalineado del href. |
| "Conoce los Perfiles" | `Users` (persona) | `/personas` | El texto sugiere explorar el **catálogo de certificaciones** (eso es literalmente `/catalogo`, ver [catalogo.astro:34](../src/pages/catalogo.astro#L34): "Explora nuestra biblioteca de perfiles..."). Hoy lleva a `/personas`, que es el portal de postulación individual, no el catálogo. |

**Sugerencia:** decidir la intención real de cada botón y alinear texto + ícono + href. Dos caminos razonables:

- **Opción A (mantener 2 audiencias en el hero):**
  - Botón 1: "Quiero Certificarme" → `/personas` (ícono `Users`)
  - Botón 2: "Servicios para Empresas" → `/empresas` (ícono `Building2`)
- **Opción B (una acción + un descubrimiento):**
  - Botón 1: "Quiero Certificarme" → `/personas`
  - Botón 2: "Ver Catálogo de Certificaciones" → `/catalogo`

Te pregunto esto en la sección de decisiones más abajo.

---

## 2. Header.jsx no recibió el rename (prioridad alta)

`Header.jsx` se muestra en **todas** las páginas (incluida el Home), así que aunque `index.astro` ya diga "Trabajadores", el usuario sigue viendo "Personas Naturales" en la barra superior y en el menú mobile.

| Archivo | Línea | Texto actual |
|---|---|---|
| [Header.jsx:27](../src/components/Header.jsx#L27) | Top bar desktop | `<Users size={14} /> Personas Naturales` |
| [Header.jsx:100](../src/components/Header.jsx#L100) | Menú mobile | `Personas Naturales` |
| [Header.jsx:30](../src/components/Header.jsx#L30) / [101](../src/components/Header.jsx#L101) | Top bar + mobile | `OTEC e Instituciones` |
| [Header.jsx:33](../src/components/Header.jsx#L33) / [102](../src/components/Header.jsx#L102) | Top bar + mobile | `Empresas e Instituciones` |

**Sugerencia:** cambiar los 4 puntos a `Trabajadores`, `Instituciones de Educación`, `Empresas` — igual que ya quedó en `Portales.jsx`. Los `href` (`/personas`, `/otec`, `/empresas`) no cambian, solo la etiqueta visible.

---

## 3. Footer.astro parcialmente desalineado (prioridad media)

[Footer.astro:24-26](../src/components/Footer.astro#L24-L26)

```
Para Empresas          → /empresas   (OK, coincide)
Para OTEC e Instituciones → /otec    (inconsistente: en el resto del sitio ya es "Instituciones de Educación")
Para Personas           → /personas  (inconsistente: en el resto del sitio ya es "Trabajadores")
```

**Sugerencia:** `Para Trabajadores`, `Para Instituciones de Educación`, `Para Empresas`.

---

## 4. Otros lugares con la nomenclatura vieja (prioridad baja, fuera del Home pero mismo criterio)

Por si quieres emparejar el sitio completo, no solo el Home:

- [ContactForm.jsx:86](../src/components/ContactForm.jsx#L86) → opción de select "Alianza para OTEC / Instituciones" (usa `ContactForm`, que también se renderiza en el Home). Podría quedar "Alianza para Instituciones Educativas".
- [perfil/[id].astro:130](../src/pages/perfil/%5Bid%5D.astro#L130) → opción de formulario "Soy Persona Natural" (no aparece en el Home, es la ficha de un perfil individual).
- [chilevalora.astro:160](../src/pages/chilevalora.astro#L160) → "personas naturales" en un párrafo descriptivo (uso genérico/legal, no es un label de audiencia — probablemente no necesita cambiar).

---

## 5. Cosas que sí quedaron bien tras tu cambio

- [index.astro:74-75](../src/pages/index.astro#L74-L75): "Para trabajadores, empresas e instituciones de educación en todo Chile." ✅ consistente y más claro que la versión anterior.
- [Portales.jsx:19](../src/components/Portales.jsx#L19), [35](../src/components/Portales.jsx#L35), [59](../src/components/Portales.jsx#L59), [79](../src/components/Portales.jsx#L79): "trabajadores", "Trabajadores", "Instituciones de Educación", "Empresas" — todo alineado y los 3 CTA de esa sección (`Portal Trabajadores` → `/personas`, `Portal Instituciones` → `/otec`, `Portal Empresas` → `/empresas`) **sí calzan** texto↔destino.

---

## Estado: resuelto (2026-08-31)

Todos los puntos de este informe fueron aplicados:

1. **Header.jsx / Footer.astro** → actualizados a "Trabajadores / Instituciones de Educación / Empresas".
2. **CTA del Hero** → decisión del usuario, distinta a las opciones A/B propuestas:
   - "Quiero Certificarme" (ícono `Users`) → `/#portales` (ancla a la sección "Elige cómo quieres Certificarte" en el propio Home). Se agregó `id="portales"` a esa `<section>` en [Portales.jsx](../src/components/Portales.jsx#L6).
   - "Conoce los Perfiles" (ícono `BookOpen`) → `/catalogo` directo (opción recomendada, en vez de anclar a la sección "¿Qué certificación necesitas?" del propio Home).
3. **Alcance extra** → también se corrigió el select de `ContactForm.jsx` ("Alianza para OTEC / Instituciones" → "Alianza para Instituciones de Educación") y el select de `perfil/[id].astro` ("Soy Persona Natural" → "Soy Trabajador/a").
