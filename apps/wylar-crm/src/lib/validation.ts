import { z } from 'zod';
import { isSafeUrl } from './safeUrl';
import { ACTIVITY_TYPE_VALUES, LEAD_TYPE_VALUES, ROLES, STATUS_VALUES } from './constants';
import { PROFILE_TEMPLATE_TYPE_VALUES, TARGET_AUDIENCE_VALUES } from './catalogSpec';
import { isValidRut, formatRut } from './rut';
import { isValidChileanMobile, formatChileanMobile } from './phone';

const ROLE_VALUES = ROLES.map((r) => r.value) as [string, ...string[]];

/** RUT: exige dígito verificador válido y normaliza al formato canónico ("12.345.678-5"). */
const rutField = z
    .string()
    .trim()
    .min(1, 'Ingresa el RUT.')
    .refine(isValidRut, 'RUT inválido. Revisa el número y el dígito verificador.')
    .transform(formatRut);

/** Teléfono: exige que sea (o se pueda interpretar como) un celular chileno
 * y lo normaliza siempre al formato "+56 9 XXXX XXXX". */
const chileanPhoneField = z
    .string()
    .trim()
    .transform((value, ctx) => {
        const formatted = isValidChileanMobile(value) ? value : formatChileanMobile(value);
        if (!formatted) {
            ctx.addIssue({ code: 'custom', message: 'Teléfono inválido. Debe ser un celular chileno, ej: +56 9 1234 5678.' });
            return z.NEVER;
        }
        return formatted;
    });


/** Nombre: siempre normalizado a MAYÚSCULAS */
const nameField = z
    .string()
    .trim()
    .min(2, 'Ingresa el nombre completo.')
    .max(120)
    .transform((val) => val.toUpperCase());

/** Correo: siempre normalizado a minúsculas */
const emailField = z
    .string()
    .trim()
    .email('Correo inválido.')
    .max(254)
    .transform((val) => val.toLowerCase());

/**
 * Datos que envía el formulario web público de wylar.cl (Módulo de Captura
 * de Oportunidades). `source`/`sourceDetail` ya vienen calculados por el
 * propio sitio (ver src/lib/leadSource.ts) — el servidor solo valida que
 * el valor de `source` sea uno de los canales conocidos.
 */
export const publicLeadSchema = z.object({
    type: z.enum(LEAD_TYPE_VALUES),
    name: nameField,
    rut: rutField,
    email: emailField,
    phone: chileanPhoneField,
    company: z.string().trim().max(200).transform((val) => (val ? val.toUpperCase() : val)).optional().nullable(),
    productId: z.coerce.number().int().positive('Selecciona un producto o servicio.'),
    comuna: z.string().trim().max(120).optional().nullable(),
    message: z.string().trim().max(2000).optional().nullable(),
    source: z.string().trim().min(1).max(50).optional(),
    sourceDetail: z.string().trim().max(2000).optional().nullable(),
    // Honeypot anti-spam: campo invisible para personas, si viene con
    // contenido es casi seguro un bot. Ver app/api/public/leads/route.ts.
    website: z.string().max(200).optional(),
});

// Alta manual de una oportunidad desde el propio CRM (ver /leads, botón
// "Nueva oportunidad"). A diferencia del formulario público, el source lo
// fija el servidor ('MANUAL'), no hay honeypot (hay sesión autenticada de
// por medio), y el mensaje se usa como nota inicial en vez de "mensaje del
// formulario".
export const manualLeadSchema = z.object({
    type: z.enum(LEAD_TYPE_VALUES),
    name: nameField,
    rut: rutField,
    email: emailField,
    phone: chileanPhoneField,
    company: z.string().trim().max(200).transform((val) => (val ? val.toUpperCase() : val)).optional().nullable(),
    productId: z.coerce.number().int().positive('Selecciona un producto o servicio.'),
    source: z.string().trim().min(1, 'Selecciona o indica el origen de la oportunidad.').max(80),
    comuna: z.string().trim().max(120).optional().nullable(),
    message: z.string().trim().max(2000).optional().nullable(),
});

// --- Módulo de Clientes ---

export const clientCreateSchema = z.object({
    type: z.enum(LEAD_TYPE_VALUES),
    name: nameField,
    rut: rutField,
    email: emailField,
    phone: chileanPhoneField,
    company: z.string().trim().max(200).transform((val) => (val ? val.toUpperCase() : val)).optional().nullable(),
});

export const clientUpdateSchema = z.object({
    type: z.enum(LEAD_TYPE_VALUES).optional(),
    name: nameField,
    rut: rutField,
    email: emailField,
    phone: chileanPhoneField,
    company: z.string().trim().max(200).transform((val) => (val ? val.toUpperCase() : val)).optional().nullable(),
});

export const clientContactSchema = z.object({
    name: z.string().trim().min(2, 'Ingresa el nombre del contacto.').max(120).transform((v) => v.toUpperCase()),
    role: z.string().trim().max(120).optional().nullable(),
    email: z.string().trim().email('Correo inválido.').max(254).transform((v) => v.toLowerCase()).optional().or(z.literal('')),
    phone: z.string().trim().transform((v) => (v ? (isValidChileanMobile(v) ? v : (formatChileanMobile(v) ?? v)) : '')).optional().or(z.literal('')),
});

// --- Módulo de Productos ---

export const productCategorySchema = z.object({
    name: z.string().trim().min(2, 'Ingresa un nombre de categoría.').max(120),
    attributeTemplate: z.string().trim().min(1).max(40),
});

export const productSchema = z.object({
    categoryId: z.coerce.number().int().positive('Selecciona una categoría.'),
    name: z.string().trim().min(2, 'Ingresa el nombre del producto.').max(200),
    description: z.string().trim().max(2000).optional().nullable(),
    price: z.coerce.number().nonnegative('El precio no puede ser negativo.').optional().nullable(),
    profileId: z.coerce.number().int().positive().optional().nullable(),
    attributes: z.record(z.string(), z.string()).optional().nullable(),
});

// --- Módulo de Cotizaciones ---

export const quoteItemSchema = z.object({
    productId: z.coerce.number().int().positive().optional().nullable(),
    description: z.string().trim().min(1, 'Falta la descripción del ítem.').max(300),
    quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a cero.'),
    unitPrice: z.coerce.number().nonnegative('El precio unitario no puede ser negativo.'),
});

export const quoteSchema = z.object({
    opportunityId: z.coerce.number().int().positive(),
    notes: z.string().trim().max(2000).optional().nullable(),
    items: z.array(quoteItemSchema).min(1, 'Agrega al menos un ítem a la cotización.'),
});

export const activityEntrySchema = z.object({
    type: z.enum(ACTIVITY_TYPE_VALUES),
    text: z.string().trim().min(1, 'Escribe una nota o descripción de la gestión.'),
});

export const statusChangeSchema = z.object({
    status: z.enum(STATUS_VALUES),
    // Obligatorio solo cuando status = DESISTIDO (se valida en la acción,
    // no acá, porque depende del valor de otro campo).
    lostReason: z.string().trim().max(500).optional().nullable(),
});

export const assignSchema = z.object({
    assignedToId: z.coerce.number().int().positive().nullable().optional(),
});

// Bandera de "no contactar": exige correo o teléfono (al menos uno) + motivo.
export const doNotContactSchema = z
    .object({
        email: z.string().trim().email('Correo inválido.').max(254).optional().or(z.literal('')),
        phone: z.string().trim().max(30).optional().or(z.literal('')),
        reason: z.string().trim().min(3, 'Ingresa el motivo.').max(500),
    })
    .refine((d) => d.email || d.phone, { message: 'Ingresa al menos un correo o teléfono.', path: ['email'] });

export const userSchema = z.object({
    name: z.string().trim().min(2, 'Ingresa el nombre completo.'),
    email: z.string().trim().email('Correo corporativo inválido.'),
    role: z.enum(ROLE_VALUES),
    password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres.').max(200),
});

// Editar un miembro existente: la contraseña es opcional (dejarla en blanco
// = no cambiarla). Si se envía, se exige el mismo mínimo que al crear.
export const userUpdateSchema = z.object({
    name: z.string().trim().min(2, 'Ingresa el nombre completo.'),
    email: z.string().trim().email('Correo corporativo inválido.'),
    role: z.enum(ROLE_VALUES),
    password: z
        .union([z.literal(''), z.string().min(12, 'La nueva contraseña debe tener al menos 12 caracteres.').max(200)])
        .optional(),
});

export const updateProfileSchema = z.object({
    name: z.string().trim().min(2, 'Ingresa tu nombre completo.').max(200),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Ingresa tu contraseña actual.'),
        newPassword: z.string().min(12, 'La nueva contraseña debe tener al menos 12 caracteres.').max(200),
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, { message: 'La confirmación no coincide con la nueva contraseña.', path: ['confirmPassword'] })
    .refine((d) => d.newPassword !== d.currentPassword, { message: 'La nueva contraseña debe ser distinta de la actual.', path: ['newPassword'] });

export const loginSchema = z.object({
    email: z.string().trim().email('Correo inválido.'),
    password: z.string().min(1, 'Ingresa tu contraseña.'),
});

// --- Módulo de Catálogo ---
// El formulario de /catalogo llama a src/actions/catalog.ts#saveProfile
// directamente con este objeto (no vía FormData: la cantidad de secciones e
// ítems es dinámica según la plantilla, ver src/lib/catalogSpec.ts).

export const profileSectionItemSchema = z.object({
    order: z.number().int().default(0),
    group: z.string().trim().max(60).optional().nullable(),
    code: z.string().trim().max(30).optional().nullable(),
    title: z.string().trim().max(300).optional().nullable(),
    text: z.string().trim().max(4000).optional().nullable(),
});

export const profileSectionSchema = z.object({
    key: z.string().trim().min(1).max(60),
    order: z.number().int().default(0),
    title: z.string().trim().max(300).optional().nullable(),
    text: z.string().trim().max(4000).optional().nullable(),
    intro: z.string().trim().max(4000).optional().nullable(),
    closing: z.string().trim().max(4000).optional().nullable(),
    note: z.string().trim().max(4000).optional().nullable(),
    items: z.array(profileSectionItemSchema).default([]),
});

export const profileFaqSchema = z.object({
    order: z.number().int().default(0),
    question: z.string().trim().min(1, 'Falta la pregunta.').max(500),
    answer: z.string().trim().min(1, 'Falta la respuesta.').max(4000),
});

export const profileSchema = z.object({
    slug: z
        .string()
        .trim()
        .min(2, 'Falta el slug (identificador en la URL).')
        .max(80)
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'El slug solo puede tener minúsculas, números y guiones.'),
    templateType: z.enum(PROFILE_TEMPLATE_TYPE_VALUES),
    title: z.string().trim().min(2, 'Falta el título.').max(200),
    description: z.string().trim().min(2, 'Falta la descripción.').max(2000),
    image: z.string().trim().min(1, 'Falta la imagen.').max(500).refine(isSafeUrl, 'La imagen debe ser una ruta que empiece con "/" o una URL https://.'),
    cardImage: z
        .string()
        .trim()
        .max(500)
        .optional()
        .nullable()
        .refine((v) => !v || isSafeUrl(v), 'La imagen debe ser una ruta que empiece con "/" o una URL https://.'),
    // Ficha Ocupacional en PDF, opcional.
    fichaUrl: z
        .string()
        .trim()
        .max(500)
        .optional()
        .nullable()
        .refine((v) => !v || isSafeUrl(v), 'El archivo debe ser una ruta que empiece con "/" o una URL https://.'),
    category: z.string().trim().min(1, 'Falta la categoría.').max(100),
    sector: z.string().trim().min(1, 'Falta el sector.').max(100),
    subsector: z.string().trim().min(1, 'Falta el subsector.').max(100),
    nivel: z.string().trim().min(1, 'Falta el nivel.').max(50),
    vigencia: z.string().trim().max(50).optional().nullable(),
    target: z.array(z.enum(TARGET_AUDIENCE_VALUES)).min(1, 'Selecciona al menos un público objetivo.'),
    isChileValora: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    active: z.boolean().default(true),
    heroHook: z.string().trim().min(2, 'Falta el gancho del hero.').max(500),
    heroParagraphs: z.array(z.string().trim().min(1).max(2000)).default([]),
    heroCta: z.string().trim().max(200).optional().nullable(),
    sections: z.array(profileSectionSchema).default([]),
    faqs: z.array(profileFaqSchema).default([]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// --- Módulo de Certificados ---

export const certificateCategorySchema = z.object({
    name: z.string().trim().min(2, 'Ingresa un nombre de categoría.').max(120),
});

export const certificateTypeSchema = z.object({
    label: z.string().trim().min(2, 'Ingresa un nombre para el tipo.').max(60),
    completionText: z.string().trim().min(2, 'Ingresa la frase que antecede al nombre de la certificación.').max(200),
});

export const certificationTitleSchema = z.object({
    name: z.string().trim().min(2, 'Ingresa el nombre de la certificación.').max(300),
});

export const certificateSchema = z.object({
    holderName: z.string().trim().min(2, 'Ingresa el nombre completo del titular.').max(200).transform((val) => val.toUpperCase()),
    holderRut: rutField,
    profileId: z.coerce.number().int().positive().optional().nullable(),
    certificationTitle: z.string().trim().min(2, 'Falta el nombre de la certificación.').max(300),
    categoryLabel: z.string().trim().min(2, 'Falta la categoría del certificado.').max(120),
    issueDate: z.coerce.date(),
    expiryDate: z.coerce.date().optional().nullable(),
    leadId: z.coerce.number().int().positive().optional().nullable(),
    detailText: z.string().trim().max(2000).optional().nullable(),
    completionText: z.string().trim().min(1).max(200),
});

export type CertificateInput = z.infer<typeof certificateSchema>;

// --- Módulo de Hero (Home de wylar.cl) ---

export const heroSlideSchema = z.object({
    order: z.coerce.number().int().default(0),
    active: z.boolean().default(true),
    image: z.string().trim().min(1, 'Falta la imagen (URL o ruta).').max(500).refine(isSafeUrl, 'La imagen debe ser una ruta que empiece con "/" o una URL https://.'),
    eyebrowLead: z.string().trim().min(1, 'Falta el texto de la etiqueta (ej. "Centro Acreditado").').max(80),
    eyebrowAccent: z.string().trim().min(1, 'Falta el texto destacado de la etiqueta (ej. "ChileValora").').max(80),
    title: z.string().trim().min(1, 'Falta el título.').max(120),
    titleHighlight: z.string().trim().min(1, 'Falta la parte destacada del título.').max(120),
    description: z.string().trim().min(1, 'Falta la descripción.').max(500),
    ctaLabel: z.string().trim().min(1, 'Falta el texto del botón.').max(60),
    ctaHref: z.string().trim().min(1, 'Falta el destino del botón (ej. /catalogo).').max(300).refine(isSafeUrl, 'El destino debe ser una ruta que empiece con "/" (ej. /catalogo) o una URL https://.'),
});

export type HeroSlideInput = z.infer<typeof heroSlideSchema>;
