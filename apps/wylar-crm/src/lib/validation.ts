import { z } from 'zod';
import { ACTIVITY_TYPE_VALUES, LEAD_TYPE_VALUES, ROLES, STATUS_VALUES } from './constants';
import { PROFILE_TEMPLATE_TYPE_VALUES, TARGET_AUDIENCE_VALUES } from './catalogSpec';

const ROLE_VALUES = ROLES.map((r) => r.value) as [string, ...string[]];

/**
 * Datos que envía el formulario web público de wylar.cl (Módulo de Captura
 * de Oportunidades). `source`/`sourceDetail` ya vienen calculados por el
 * propio sitio (ver src/lib/leadSource.ts) — el servidor solo valida que
 * el valor de `source` sea uno de los canales conocidos.
 */
export const publicLeadSchema = z.object({
    type: z.enum(LEAD_TYPE_VALUES),
    name: z.string().trim().min(2, 'Ingresa el nombre completo.'),
    email: z.string().trim().email('Correo inválido.'),
    phone: z.string().trim().min(6, 'Ingresa un teléfono de contacto.'),
    company: z.string().trim().max(200).optional().nullable(),
    certificationInterest: z.string().trim().max(200).optional().nullable(),
    message: z.string().trim().max(2000).optional().nullable(),
    source: z.string().trim().min(1).max(50).optional(),
    sourceDetail: z.string().trim().max(2000).optional().nullable(),
    // Honeypot anti-spam: campo invisible para personas, si viene con
    // contenido es casi seguro un bot. Ver app/api/public/leads/route.ts.
    website: z.string().max(0).optional().or(z.literal('')),
});

export const activityEntrySchema = z.object({
    type: z.enum(ACTIVITY_TYPE_VALUES),
    text: z.string().trim().min(1, 'Escribe una nota o descripción de la gestión.'),
});

export const statusChangeSchema = z.object({
    status: z.enum(STATUS_VALUES),
});

export const assignSchema = z.object({
    assignedToId: z.coerce.number().int().positive().nullable().optional(),
});

export const userSchema = z.object({
    name: z.string().trim().min(2, 'Ingresa el nombre completo.'),
    email: z.string().trim().email('Correo corporativo inválido.'),
    role: z.enum(ROLE_VALUES),
    password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres.'),
});

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
    image: z.string().trim().min(1, 'Falta la imagen.').max(500),
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

export const certificateSchema = z.object({
    holderName: z.string().trim().min(2, 'Ingresa el nombre completo del titular.').max(200),
    holderRut: z.string().trim().min(3, 'Ingresa el RUT del titular.').max(20),
    profileId: z.coerce.number().int().positive().optional().nullable(),
    certificationTitle: z.string().trim().min(2, 'Falta el nombre de la certificación.').max(300),
    categoryLabel: z.string().trim().min(2, 'Falta la categoría del certificado.').max(120),
    issueDate: z.coerce.date(),
    expiryDate: z.coerce.date().optional().nullable(),
    leadId: z.coerce.number().int().positive().optional().nullable(),
});

export type CertificateInput = z.infer<typeof certificateSchema>;
