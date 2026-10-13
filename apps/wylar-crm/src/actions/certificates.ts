'use server';

import { revalidatePath } from 'next/cache';
import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { normalizeRut } from '@/lib/rut';
import { certificateSchema, type CertificateInput } from '@/lib/validation';

export interface CertificateFormState {
    error?: string;
    success?: string;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones al leerlo.

function randomCodeSuffix(length: number): string {
    let out = '';
    for (let i = 0; i < length; i++) {
        out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
    return out;
}

/** Genera un código único de validación, ej. "WYL-2026-K3F9A2". */
async function generateUniqueCertificateCode(): Promise<string> {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 10; attempt++) {
        const code = `WYL-${year}-${randomCodeSuffix(6)}`;
        const existing = await prisma.certificate.findUnique({ where: { code } });
        if (!existing) return code;
    }
    throw new Error('No se pudo generar un código único de certificado, intenta nuevamente.');
}

/** Emite un certificado. Lo puede hacer cualquier usuario autenticado (ADMIN o COMERCIAL). */
export async function issueCertificate(input: CertificateInput): Promise<CertificateFormState> {
    const currentUser = await requireUser();

    const parsed = certificateSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del certificado.' };
    }
    const data = parsed.data;

    const code = await generateUniqueCertificateCode();

    await prisma.certificate.create({
        data: {
            code,
            holderName: data.holderName,
            holderRut: data.holderRut,
            holderRutNorm: normalizeRut(data.holderRut),
            profileId: data.profileId || null,
            certificationTitle: data.certificationTitle,
            categoryLabel: data.categoryLabel,
            detailText: data.detailText || null,
            completionText: data.completionText,
            issueDate: data.issueDate,
            expiryDate: data.expiryDate || null,
            leadId: data.leadId || null,
            issuedById: currentUser.id,
        },
    });

    await audit(currentUser, 'CERTIFICADO_EMITIDO', 'certificado', code, `${data.holderName} · ${data.certificationTitle}`);
    revalidatePath('/certificados');
    return { success: `Certificado emitido con código ${code}.` };
}

/**
 * Edita un certificado ya emitido (solo ADMIN) — corrige datos sin cambiar
 * su código de validación. No toca profileId/leadId: el formulario no los
 * expone, así que se preservan tal cual quedaron al emitirlo.
 */
export async function updateCertificate(certificateId: number, input: CertificateInput): Promise<CertificateFormState> {
    const admin = await requireAdmin();

    const parsed = certificateSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del certificado.' };
    }
    const data = parsed.data;

    const existing = await prisma.certificate.findUnique({ where: { id: certificateId } });
    if (!existing) return { error: 'El certificado no existe.' };

    await prisma.certificate.update({
        where: { id: certificateId },
        data: {
            holderName: data.holderName,
            holderRut: data.holderRut,
            holderRutNorm: normalizeRut(data.holderRut),
            certificationTitle: data.certificationTitle,
            categoryLabel: data.categoryLabel,
            detailText: data.detailText || null,
            completionText: data.completionText,
            issueDate: data.issueDate,
            expiryDate: data.expiryDate || null,
        },
    });

    await audit(admin, 'CERTIFICADO_EDITADO', 'certificado', existing.code, `${data.holderName} · ${data.certificationTitle}`);
    revalidatePath('/certificados');
    return { success: `Certificado ${existing.code} actualizado.` };
}

/**
 * Elimina definitivamente un certificado (solo ADMIN, ej. registros de
 * prueba o emitidos por error). A diferencia de revocar, esto borra el
 * registro: deja de existir en el validador. Queda registrado en la
 * auditoría quién lo eliminó, cuándo y los datos del certificado borrado.
 */
export async function deleteCertificate(certificateId: number): Promise<CertificateFormState> {
    const admin = await requireAdmin();

    const certificate = await prisma.certificate.findUnique({ where: { id: certificateId } });
    if (!certificate) return { error: 'El certificado no existe.' };

    await prisma.certificate.delete({ where: { id: certificateId } });
    await audit(admin, 'CERTIFICADO_ELIMINADO', 'certificado', certificate.code, `${certificate.holderName} · ${certificate.certificationTitle}`);
    revalidatePath('/certificados');
    return { success: `Certificado ${certificate.code} eliminado.` };
}

/**
 * Revoca un certificado (solo ADMIN). No se borra: queda marcado como revocado,
 * el validador público lo muestra como "Revocado" y su PDF deja de estar disponible.
 */
export async function revokeCertificate(certificateId: number): Promise<CertificateFormState> {
    const admin = await requireAdmin();

    const certificate = await prisma.certificate.findUnique({ where: { id: certificateId } });
    if (!certificate) return { error: 'El certificado no existe.' };
    if (certificate.revokedAt) return { error: 'El certificado ya estaba revocado.' };

    await prisma.certificate.update({ where: { id: certificateId }, data: { revokedAt: new Date(), revokedByName: admin.name } });
    await audit(admin, 'CERTIFICADO_REVOCADO', 'certificado', certificate.code, `${certificate.holderName} · ${certificate.certificationTitle}`);
    revalidatePath('/certificados');
    return { success: 'Certificado revocado.' };
}
