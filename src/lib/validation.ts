import { z } from 'zod';
import { ACTIVITY_TYPE_VALUES, LEAD_TYPE_VALUES, ROLES, STATUS_VALUES } from './constants';

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
