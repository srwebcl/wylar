import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/lib/publicApi';
import { certificateStatus, certificateStatusLabel } from '@/lib/constants';

// Módulo de Certificados: endpoint público (sin sesión) que consume
// wylar.cl/validador. Busca por código de certificado o por RUT (puede
// haber más de un certificado para el mismo RUT) y devuelve los datos
// completos — el diseño del validador (ver Validador.jsx en wylar) ya
// muestra el RUT completo como parte del propio flujo de búsqueda.

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

function normalizeRut(value: string): string {
    return value.replace(/[.-]/g, '').toLowerCase();
}

export async function GET(request: Request) {
    const headers = corsHeaders(request.headers.get('origin'));
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('code') ?? searchParams.get('rut') ?? searchParams.get('q');

    if (!query || !query.trim()) {
        return Response.json({ ok: false, error: 'Ingresa un RUT o código de certificado.' }, { status: 400, headers });
    }

    const cleanQuery = normalizeRut(query.trim());
    const certificates = await prisma.certificate.findMany({
        include: { profile: { select: { slug: true } } },
    });

    const results = certificates.filter(
        (cert) => cert.code.toLowerCase() === query.trim().toLowerCase() || normalizeRut(cert.holderRut) === cleanQuery,
    );

    const data = results.map((cert) => {
        const status = certificateStatus(cert.expiryDate);
        return {
            code: cert.code,
            holderName: cert.holderName,
            holderRut: cert.holderRut,
            certificationTitle: cert.certificationTitle,
            categoryLabel: cert.categoryLabel,
            issueDate: cert.issueDate.toISOString(),
            expiryDate: cert.expiryDate ? cert.expiryDate.toISOString() : null,
            status,
            statusLabel: certificateStatusLabel(status),
            profileSlug: cert.profile?.slug ?? null,
            pdfUrl: `/api/public/certificates/${cert.code}/pdf`,
        };
    });

    return Response.json({ ok: true, results: data }, { status: 200, headers });
}
