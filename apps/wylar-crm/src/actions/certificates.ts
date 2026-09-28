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
