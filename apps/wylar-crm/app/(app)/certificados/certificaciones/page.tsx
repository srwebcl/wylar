import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { CertificationTitlesManagement } from '@/components/CertificationTitlesManagement';

export default async function CertificacionesPage() {
    const currentUser = await requireUser();

    const titles = await prisma.certificationTitle.findMany({ orderBy: { name: 'asc' } });

    return (
        <CertificationTitlesManagement
            titles={titles.map((t) => ({ id: t.id, name: t.name, createdAt: t.createdAt.toISOString() }))}
            isAdmin={currentUser.role === 'ADMIN'}
        />
    );
}
