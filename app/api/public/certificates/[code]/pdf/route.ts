import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/lib/publicApi';
import { certificateStatus, certificateStatusLabel } from '@/lib/constants';
import { CertificatePdf } from '@/components/CertificatePdf';

// Módulo de Certificados: PDF descargable, generado al vuelo con
// @react-pdf/renderer a partir de los datos guardados — no se persiste
// ningún archivo, así el PDF nunca puede quedar desactualizado respecto al
// registro del certificado (ver decisión en prisma/schema.prisma#Certificate).

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const headers = corsHeaders(request.headers.get('origin'));

    const certificate = await prisma.certificate.findUnique({ where: { code } });
    if (!certificate) {
        return Response.json({ ok: false, error: 'Certificado no encontrado.' }, { status: 404, headers });
    }

    const status = certificateStatus(certificate.expiryDate);
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
        }),
    );

    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            ...headers,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="certificado-${certificate.code}.pdf"`,
        },
    });
}
