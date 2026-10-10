'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/auth';
import { certificateCategorySchema, certificateTypeSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export interface CertificateMetaState {
    error?: string;
    success?: string;
}

/**
 * Categorías y tipos de certificado: listas administrables desde
 * /certificados/configuracion, pero también creables al vuelo desde el
 * propio formulario de "Emitir certificado" (ver SearchableCreatableSelect)
 * — por eso crear solo exige sesión, no admin; borrar sí, porque afecta a
 * todo el equipo.
 */

export async function createCertificateCategory(_prevState: CertificateMetaState, formData: FormData): Promise<CertificateMetaState> {
    const user = await requireUser();
    const parsed = certificateCategorySchema.safeParse({ name: formData.get('name') });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

    const existing = await prisma.certificateCategory.findUnique({ where: { name: parsed.data.name } });
    if (existing) return { error: 'Ya existe esa categoría.' };

    await prisma.certificateCategory.create({ data: { name: parsed.data.name } });
    await audit(user, 'CATEGORIA_CERTIFICADO_CREADA', 'certificate_category', parsed.data.name);
    revalidatePath('/certificados');
    revalidatePath('/certificados/configuracion');
    return { success: 'Categoría creada.' };
}

export async function deleteCertificateCategory(id: number): Promise<CertificateMetaState> {
    const admin = await requireAdmin();
    const category = await prisma.certificateCategory.findUnique({ where: { id } });
    if (!category) return { error: 'La categoría no existe.' };

    await prisma.certificateCategory.delete({ where: { id } });
    await audit(admin, 'CATEGORIA_CERTIFICADO_ELIMINADA', 'certificate_category', category.name);
    revalidatePath('/certificados');
    revalidatePath('/certificados/configuracion');
    return { success: 'Categoría eliminada.' };
}

export async function createCertificateType(_prevState: CertificateMetaState, formData: FormData): Promise<CertificateMetaState> {
    const user = await requireUser();
    const parsed = certificateTypeSchema.safeParse({
        label: formData.get('label'),
        completionText: formData.get('completionText'),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

    const existing = await prisma.certificateType.findUnique({ where: { label: parsed.data.label } });
    if (existing) return { error: 'Ya existe un tipo con ese nombre.' };

    await prisma.certificateType.create({ data: parsed.data });
    await audit(user, 'TIPO_CERTIFICADO_CREADO', 'certificate_type', parsed.data.label);
    revalidatePath('/certificados');
    revalidatePath('/certificados/configuracion');
    return { success: 'Tipo creado.' };
}

export async function deleteCertificateType(id: number): Promise<CertificateMetaState> {
    const admin = await requireAdmin();
    const type = await prisma.certificateType.findUnique({ where: { id } });
    if (!type) return { error: 'El tipo no existe.' };

    await prisma.certificateType.delete({ where: { id } });
    await audit(admin, 'TIPO_CERTIFICADO_ELIMINADO', 'certificate_type', type.label);
    revalidatePath('/certificados');
    revalidatePath('/certificados/configuracion');
    return { success: 'Tipo eliminado.' };
}
