import QRCode from 'qrcode';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/lib/publicApi';
import { certificateStatus, certificateStatusLabel } from '@/lib/constants';
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rateLimit';
import { CertificatePdf } from '@/components/CertificatePdf';

// Módulo de Certificados: PDF descargable, generado al vuelo con
// @react-pdf/renderer a partir de los datos guardados — no se persiste
// ningún archivo, así el PDF nunca puede quedar desactualizado respecto al
// registro del certificado (ver decisión en prisma/schema.prisma#Certificate).

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

// El QR del PDF abre el validador en el sitio público (primer origen permitido).
function siteOrigin(): string {
    return (process.env.PUBLIC_FORM_ORIGINS ?? '').split(',')[0]?.trim() || 'https://wylar.cl';
}

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const headers = corsHeaders(request.headers.get('origin'));

    // Generar un PDF cuesta CPU: 20 por minuto por IP.
    const limit = await rateLimit('pdf', clientIp(request.headers), 20, 60);
    if (!limit.ok) return tooManyRequests(limit.retryAfter, headers);

    const certificate = code.length <= 40 ? await prisma.certificate.findUnique({ where: { code } }) : null;
    // Un certificado revocado no se puede descargar.
    if (!certificate || certificate.revokedAt) {
        return Response.json({ ok: false, error: 'Certificado no encontrado.' }, { status: 404, headers });
    }

    const status = certificateStatus(certificate.expiryDate, certificate.revokedAt);
    const qrDataUrl = await QRCode.toDataURL(`${siteOrigin()}/validador?code=${encodeURIComponent(certificate.code)}`, { width: 300, margin: 1 });
    const buffer = await renderToBuffer(
        CertificatePdf({
            code: certificate.code,
            holderName: certificate.holderName,
            holderRut: certificate.holderRut,
            certificationTitle: certificate.certificationTitle,
            categoryLabel: certificate.categoryLabel,
            issueDate: certificate.issueDate,
            expiryDate: certificate.expiryDate,
            statusLabel: certificateStatusLabel(status),
            qrDataUrl,
        }),
    );

    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            ...headers,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="certificado-${certificate.code}.pdf"`,
            // Caché corta: si se revoca, deja de servirse en pocos minutos.
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
    });
}
