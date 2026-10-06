import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { certificateStatus, certificateStatusLabel } from '@/lib/constants';
import { buildCertificatesWhere } from '@/lib/certificatesFilter';
import { CertificateManagement } from '@/components/CertificateManagement';

const PAGE_SIZE = 10;

export default async function CertificadosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const currentUser = await requireUser();
    const params = await searchParams;
    const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
    const where = buildCertificatesWhere(params);

    const [certificates, total] = await Promise.all([
        prisma.certificate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { issuedBy: { select: { name: true } } },
            take: PAGE_SIZE,
            skip: (page - 1) * PAGE_SIZE,
        }),
        prisma.certificate.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const pageHref = (p: number) => {
        const qs = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && k !== 'page') as [string, string][]);
        qs.set('page', String(p));
        return `/certificados?${qs.toString()}`;
    };

    return (
        <div>
            <CertificateManagement
                isAdmin={currentUser.role === 'ADMIN'}
                total={total}
                certificates={certificates.map((c) => {
                    const status = certificateStatus(c.expiryDate, c.revokedAt);
                    return {
                        id: c.id,
                        code: c.code,
                        holderName: c.holderName,
                        holderRut: c.holderRut,
                        certificationTitle: c.certificationTitle,
                        categoryLabel: c.categoryLabel,
                        issueDate: c.issueDate.toISOString(),
                        expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
                        status,
                        statusLabel: certificateStatusLabel(status),
                        issuedByName: c.issuedBy?.name ?? null,
                    };
                })}
            />

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
                    <span>Página {Math.min(page, totalPages)} de {totalPages}</span>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <Link href={pageHref(page - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">
                                ← Anterior
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link href={pageHref(page + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">
                                Siguiente →
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
