import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/lib/publicApi';
import { certificateStatus, certificateStatusLabel } from '@/lib/constants';
import { normalizeRut } from '@/lib/rut';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rateLimit';

// Módulo de Certificados: endpoint público (sin sesión) que consume
// wylar.cl/validador. Busca por código de certificado o por RUT (puede
// haber más de un certificado para el mismo RUT) y devuelve los datos
// completos — el diseño del validador (ver Validador.jsx en wylar) ya
// muestra el RUT completo como parte del propio flujo de búsqueda.
//
// La búsqueda se hace en la base con columnas indexadas (code y
// holderRutNorm): no se cargan todos los certificados en memoria.

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request: Request) {
    const headers = corsHeaders(request.headers.get('origin'));

    // Frena la enumeración de RUT / códigos: 30 consultas por minuto por IP.
    const limit = await rateLimit('validate', clientIp(request.headers), 30, 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfter, headers);

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('code') ?? searchParams.get('rut') ?? searchParams.get('q') ?? '').trim();

    if (!query) {
        return Response.json({ ok: false, error: 'Ingresa un RUT o código de certificado.' }, { status: 400, headers });
    }
    if (query.length > 40) {
        return Response.json({ ok: false, error: 'El RUT o código ingresado no es válido.' }, { status: 400, headers });
    }

    const rutNorm = normalizeRut(query);
    const results = await prisma.certificate.findMany({
        where: { OR: [{ code: { equals: query, mode: 'insensitive' } }, ...(rutNorm ? [{ holderRutNorm: rutNorm }] : [])] },
        include: { profile: { select: { slug: true } } },
        orderBy: { issueDate: 'desc' },
        take: 20,
    });

    const data = results.map((cert) => {
        const status = certificateStatus(cert.expiryDate, cert.revokedAt);
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
            // Un certificado revocado no ofrece descarga.
            pdfUrl: status === 'REVOCADO' ? null : `/api/public/certificates/${cert.code}/pdf`,
        };
    });

    return Response.json({ ok: true, results: data }, { status: 200, headers });
}
