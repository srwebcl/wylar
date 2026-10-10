'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/auth';
import { certificateCategorySchema, certificateTypeSchema, certificationTitleSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export interface CertificateMetaState {
    error?: string;
    success?: string;
}

/**
 * Categorías, tipos y nombres de certificación: listas administrables desde
 * /certificados/configuracion y /certificados/certificaciones, pero también
 * creables al vuelo desde el propio formulario de "Emitir certificado" (ver
 * SearchableCreatableSelect) — por eso crear solo exige sesión, no admin;
 * editar y borrar sí, porque afectan a todo el equipo. Ninguna de las tres
 * es FK de Certificate (ver comentario en schema.prisma), así que editar o
 * borrar una entrada nunca altera certificados ya emitidos — solo cambia
 * las opciones sugeridas hacia adelante.
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

export async function updateCertificateCategory(id: number, _prevState: CertificateMetaState, formData: FormData): Promise<CertificateMetaState> {
    const admin = await requireAdmin();
    const parsed = certificateCategorySchema.safeParse({ name: formData.get('name') });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

    const category = await prisma.certificateCategory.findUnique({ where: { id } });
    if (!category) return { error: 'La categoría no existe.' };

    const clash = await prisma.certificateCategory.findUnique({ where: { name: parsed.data.name } });
    if (clash && clash.id !== id) return { error: 'Ya existe otra categoría con ese nombre.' };

    await prisma.certificateCategory.update({ where: { id }, data: { name: parsed.data.name } });
    await audit(admin, 'CATEGORIA_CERTIFICADO_EDITADA', 'certificate_category', parsed.data.name, `antes: ${category.name}`);
    revalidatePath('/certificados');
    revalidatePath('/certificados/configuracion');
    return { success: 'Categoría actualizada.' };
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

export async function updateCertificateType(id: number, _prevState: CertificateMetaState, formData: FormData): Promise<CertificateMetaState> {
    const admin = await requireAdmin();
    const parsed = certificateTypeSchema.safeParse({
        label: formData.get('label'),
        completionText: formData.get('completionText'),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

    const type = await prisma.certificateType.findUnique({ where: { id } });
    if (!type) return { error: 'El tipo no existe.' };

    const clash = await prisma.certificateType.findUnique({ where: { label: parsed.data.label } });
    if (clash && clash.id !== id) return { error: 'Ya existe otro tipo con ese nombre.' };

    await prisma.certificateType.update({ where: { id }, data: parsed.data });
    await audit(admin, 'TIPO_CERTIFICADO_EDITADO', 'certificate_type', parsed.data.label, `antes: ${type.label}`);
    revalidatePath('/certificados');
    revalidatePath('/certificados/configuracion');
    return { success: 'Tipo actualizado.' };
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

export async function createCertificationTitle(_prevState: CertificateMetaState, formData: FormData): Promise<CertificateMetaState> {
    const user = await requireUser();
    const parsed = certificationTitleSchema.safeParse({ name: formData.get('name') });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

    const existing = await prisma.certificationTitle.findUnique({ where: { name: parsed.data.name } });
    if (existing) return { error: 'Ya existe esa certificación.' };

    await prisma.certificationTitle.create({ data: { name: parsed.data.name } });
    await audit(user, 'CERTIFICACION_CREADA', 'certification_title', parsed.data.name);
    revalidatePath('/certificados');
    revalidatePath('/certificados/certificaciones');
    return { success: 'Certificación creada.' };
}

export async function updateCertificationTitle(id: number, _prevState: CertificateMetaState, formData: FormData): Promise<CertificateMetaState> {
    const admin = await requireAdmin();
    const parsed = certificationTitleSchema.safeParse({ name: formData.get('name') });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

    const title = await prisma.certificationTitle.findUnique({ where: { id } });
    if (!title) return { error: 'La certificación no existe.' };

    const clash = await prisma.certificationTitle.findUnique({ where: { name: parsed.data.name } });
    if (clash && clash.id !== id) return { error: 'Ya existe otra certificación con ese nombre.' };

    await prisma.certificationTitle.update({ where: { id }, data: { name: parsed.data.name } });
    await audit(admin, 'CERTIFICACION_EDITADA', 'certification_title', parsed.data.name, `antes: ${title.name}`);
    revalidatePath('/certificados');
    revalidatePath('/certificados/certificaciones');
    return { success: 'Certificación actualizada.' };
}

export async function deleteCertificationTitle(id: number): Promise<CertificateMetaState> {
    const admin = await requireAdmin();
    const title = await prisma.certificationTitle.findUnique({ where: { id } });
    if (!title) return { error: 'La certificación no existe.' };

    await prisma.certificationTitle.delete({ where: { id } });
    await audit(admin, 'CERTIFICACION_ELIMINADA', 'certification_title', title.name);
    revalidatePath('/certificados');
    revalidatePath('/certificados/certificaciones');
    return { success: 'Certificación eliminada.' };
}
