import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ProductManagement } from '@/components/ProductManagement';

export default async function ProductosPage() {
    const currentUser = await requireUser();

    const [products, categories, profiles] = await Promise.all([
        prisma.product.findMany({ include: { category: true }, orderBy: { name: 'asc' } }),
        prisma.productCategory.findMany({ orderBy: { name: 'asc' } }),
        prisma.profile.findMany({ where: { active: true }, orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    ]);

    return (
        <ProductManagement
            isAdmin={currentUser.role === 'ADMIN'}
            categories={categories}
            profiles={profiles}
            products={products.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price != null ? Number(p.price) : null,
                active: p.active,
                categoryId: p.categoryId,
                categoryName: p.category.name,
                profileId: p.profileId,
                attributes: (p.attributes as Record<string, string> | null) ?? null,
            }))}
        />
    );
}
