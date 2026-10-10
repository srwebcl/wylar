import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { CertificateMetaManagement } from '@/components/CertificateMetaManagement';

export default async function CertificadosConfiguracionPage() {
    const currentUser = await requireUser();

    const [categories, types] = await Promise.all([
        prisma.certificateCategory.findMany({ orderBy: { name: 'asc' } }),
        prisma.certificateType.findMany({ orderBy: { label: 'asc' } }),
    ]);

    return <CertificateMetaManagement categories={categories} types={types} isAdmin={currentUser.role === 'ADMIN'} />;
}
