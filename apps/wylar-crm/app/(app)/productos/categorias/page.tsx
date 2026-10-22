import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ProductCategoriesManagement } from '@/components/ProductCategoriesManagement';

export default async function ProductCategoriesPage() {
    const currentUser = await requireUser();
    const categories = await prisma.productCategory.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
    });

    return (
        <ProductCategoriesManagement
            categories={categories.map((c) => ({
                id: c.id,
                name: c.name,
                attributeTemplate: c.attributeTemplate,
                active: c.active,
                productsCount: c._count.products,
            }))}
            isAdmin={currentUser.role === 'ADMIN'}
        />
    );
}
