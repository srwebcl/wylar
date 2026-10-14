import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ProductCategoriesManagement } from '@/components/ProductCategoriesManagement';

export default async function ProductCategoriesPage() {
    const currentUser = await requireUser();
    const categories = await prisma.productCategory.findMany({ orderBy: { name: 'asc' } });

    return <ProductCategoriesManagement categories={categories} isAdmin={currentUser.role === 'ADMIN'} />;
}
