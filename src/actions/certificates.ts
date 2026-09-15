'use server';

import { revalidatePath } from 'next/cache';
import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
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
            profileId: data.profileId || null,
            certificationTitle: data.certificationTitle,
            categoryLabel: data.categoryLabel,
            issueDate: data.issueDate,
            expiryDate: data.expiryDate || null,
            leadId: data.leadId || null,
            issuedById: currentUser.id,
        },
    });

    revalidatePath('/certificados');
    return { success: `Certificado emitido con código ${code}.` };
}

export async function revokeCertificate(certificateId: number): Promise<CertificateFormState> {
    await requireUser();
    await prisma.certificate.delete({ where: { id: certificateId } });
    revalidatePath('/certificados');
    return { success: 'Certificado eliminado.' };
}
