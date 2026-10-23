import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { CertificateConfigHub } from '@/components/CertificateConfigHub';

export default async function CertificadosConfiguracionPage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | undefined>>;
}) {
    const currentUser = await requireUser();
    const params = searchParams ? await searchParams : {};

    const [titles, types, categories] = await Promise.all([
        prisma.certificationTitle.findMany({
            orderBy: { name: 'asc' },
            include: { type: true, category: true },
        }),
        prisma.certificateType.findMany({ orderBy: { label: 'asc' } }),
        prisma.certificateCategory.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const initialTab = (
        params.tab === 'tipos' || params.tab === 'categorias' || params.tab === 'certificaciones'
            ? params.tab
            : 'certificaciones'
    ) as 'certificaciones' | 'tipos' | 'categorias';

    return (
        <CertificateConfigHub
            initialTab={initialTab}
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
