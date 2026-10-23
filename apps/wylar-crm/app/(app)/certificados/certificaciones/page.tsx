import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { CertificationTitlesManagement } from '@/components/CertificationTitlesManagement';

export default async function CertificacionesPage() {
    const currentUser = await requireUser();

    const [titles, types, categories] = await Promise.all([
        prisma.certificationTitle.findMany({
            orderBy: { name: 'asc' },
            include: { type: true, category: true },
        }),
        prisma.certificateType.findMany({ orderBy: { label: 'asc' } }),
        prisma.certificateCategory.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return (
        <CertificationTitlesManagement
            titles={titles.map((t) => ({
                id: t.id,
                name: t.name,
                createdAt: t.createdAt.toISOString(),
                typeId: t.typeId,
                categoryId: t.categoryId,
                type: t.type ? { id: t.type.id, label: t.type.label, completionText: t.type.completionText } : null,
                category: t.category ? { id: t.category.id, name: t.category.name } : null,
            }))}
            types={types.map((tp) => ({ id: tp.id, label: tp.label, completionText: tp.completionText }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            isAdmin={currentUser.role === 'ADMIN'}
        />
    );
}
