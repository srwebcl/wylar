import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { certificateStatus, certificateStatusLabel } from '@/lib/constants';
import { buildCertificatesWhere } from '@/lib/certificatesFilter';
import { CertificateManagement } from '@/components/CertificateManagement';
import { Pagination, buildPageHref } from '@/components/ui/Pagination';

const PAGE_SIZE = 10;

export default async function CertificadosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const currentUser = await requireUser();
    const params = await searchParams;
    const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
    const where = buildCertificatesWhere(params);

    const [certificates, total, certificationTitleRows, categoryRows, typeRows] = await Promise.all([
        prisma.certificate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { issuedBy: { select: { name: true } } },
            take: PAGE_SIZE,
            skip: (page - 1) * PAGE_SIZE,
        }),
        prisma.certificate.count({ where }),
        prisma.certificationTitle.findMany({ orderBy: { name: 'asc' } }),
        prisma.certificateCategory.findMany({ orderBy: { name: 'asc' } }),
        prisma.certificateType.findMany({ orderBy: { label: 'asc' } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div>
            <CertificateManagement
                isAdmin={currentUser.role === 'ADMIN'}
                total={total}
                certificationTitles={certificationTitleRows.map((r) => r.name)}
                categories={categoryRows.map((c) => c.name)}
                types={typeRows}
                certificates={certificates.map((c) => {
                    const status = certificateStatus(c.expiryDate, c.revokedAt);
                    return {
                        id: c.id,
                        code: c.code,
                        holderName: c.holderName,
                        holderRut: c.holderRut,
                        certificationTitle: c.certificationTitle,
                        categoryLabel: c.categoryLabel,
                        completionText: c.completionText,
                        detailText: c.detailText,
                        issueDate: c.issueDate.toISOString(),
                        expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
                        status,
                        statusLabel: certificateStatusLabel(status),
                        issuedByName: c.issuedBy?.name ?? null,
                    };
                })}
            />

            <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildPageHref('/certificados', params, p)} />
        </div>
    );
}
