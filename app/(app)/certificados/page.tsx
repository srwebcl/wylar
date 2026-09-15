import { prisma } from '@/lib/prisma';
import { certificateStatus, certificateStatusLabel } from '@/lib/constants';
import { CertificateManagement } from '@/components/CertificateManagement';

export default async function CertificadosPage() {
    const [certificates, profiles, closedLeads] = await Promise.all([
        prisma.certificate.findMany({ orderBy: { createdAt: 'desc' }, include: { issuedBy: { select: { name: true } } } }),
        prisma.profile.findMany({ where: { active: true }, orderBy: { title: 'asc' }, select: { id: true, title: true, templateType: true } }),
        prisma.lead.findMany({ where: { status: 'CERRADO' }, orderBy: { name: 'asc' }, select: { id: true, name: true, email: true, certificationInterest: true } }),
    ]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Certificados</h1>
                <p className="text-slate-500 text-sm mt-1">Emisión y validación de certificados — se consultan desde wylar.cl/validador.</p>
            </div>

            <CertificateManagement
                profiles={profiles}
                closedLeads={closedLeads}
                certificates={certificates.map((c) => {
                    const status = certificateStatus(c.expiryDate);
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
        </div>
    );
}
