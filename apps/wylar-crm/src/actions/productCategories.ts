'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/auth';
import { productCategorySchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export interface ProductCategoryFormState {
    error?: string;
    success?: string;
}

/** Crear exige solo sesión (se puede crear al vuelo desde el formulario de
 * producto); editar y desactivar exigen ADMIN porque afectan a todo el
 * equipo — mismo patrón que certificateMeta.ts. */
export async function createProductCategory(_prevState: ProductCategoryFormState, formData: FormData): Promise<ProductCategoryFormState> {
    const user = await requireUser();
    const parsed = productCategorySchema.safeParse({ name: formData.get('name'), attributeTemplate: formData.get('attributeTemplate') || 'GENERICO' });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

    const existing = await prisma.productCategory.findUnique({ where: { name: parsed.data.name } });
    if (existing) return { error: 'Ya existe esa categoría.' };

    await prisma.productCategory.create({ data: parsed.data });
    await audit(user, 'CATEGORIA_PRODUCTO_CREADA', 'product_category', parsed.data.name);
    revalidatePath('/productos');
    revalidatePath('/productos/categorias');
    return { success: 'Categoría creada.' };
}

export async function updateProductCategory(id: number, _prevState: ProductCategoryFormState, formData: FormData): Promise<ProductCategoryFormState> {
    const admin = await requireAdmin();
    const parsed = productCategorySchema.safeParse({ name: formData.get('name'), attributeTemplate: formData.get('attributeTemplate') || 'GENERICO' });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

    const category = await prisma.productCategory.findUnique({ where: { id } });
    if (!category) return { error: 'La categoría no existe.' };

    const clash = await prisma.productCategory.findUnique({ where: { name: parsed.data.name } });
    if (clash && clash.id !== id) return { error: 'Ya existe otra categoría con ese nombre.' };

    await prisma.productCategory.update({ where: { id }, data: parsed.data });
    await audit(admin, 'CATEGORIA_PRODUCTO_EDITADA', 'product_category', parsed.data.name, `antes: ${category.name}`);
    revalidatePath('/productos');
    revalidatePath('/productos/categorias');
    return { success: 'Categoría actualizada.' };
}

/** No se borra (podría tener productos asociados) — se desactiva, igual que
 * un producto. Queda fuera de los selectores nuevos pero el historial
 * (productos ya creados, oportunidades ya cerradas) no se altera. */
export async function toggleProductCategoryActive(id: number): Promise<ProductCategoryFormState> {
    const admin = await requireAdmin();
    const category = await prisma.productCategory.findUnique({ where: { id } });
    if (!category) return { error: 'La categoría no existe.' };

    await prisma.productCategory.update({ where: { id }, data: { active: !category.active } });
    await audit(admin, category.active ? 'CATEGORIA_PRODUCTO_DESACTIVADA' : 'CATEGORIA_PRODUCTO_ACTIVADA', 'product_category', category.name);
    revalidatePath('/productos');
    revalidatePath('/productos/categorias');
    return { success: category.active ? 'Categoría desactivada.' : 'Categoría activada.' };
}

/** Elimina una categoría del catálogo si no tiene productos asociados. */
export async function deleteProductCategory(id: number): Promise<ProductCategoryFormState> {
    const admin = await requireAdmin();
    const category = await prisma.productCategory.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } },
    });
    if (!category) return { error: 'La categoría no existe.' };

    if (category._count.products > 0) {
        return {
            error: `No se puede eliminar porque contiene ${category._count.products} servicio(s) asociados. Reasigna o elimina los servicios primero.`,
        };
    }

    await prisma.productCategory.delete({ where: { id } });
    await audit(admin, 'CATEGORIA_PRODUCTO_ELIMINADA', 'product_category', category.name);
    revalidatePath('/productos');
    revalidatePath('/productos/categorias');
    return { success: `Categoría "${category.name}" eliminada exitosamente.` };
}

/** Eliminación masiva de categorías seleccionadas. */
export async function bulkDeleteProductCategories(ids: number[]): Promise<ProductCategoryFormState> {
    const admin = await requireAdmin();
    if (!ids.length) return { error: 'No se seleccionaron categorías.' };

    const categories = await prisma.productCategory.findMany({
        where: { id: { in: ids } },
        include: { _count: { select: { products: true } } },
    });

    const withProducts = categories.filter((c) => c._count.products > 0);
    if (withProducts.length > 0) {
        return {
            error: `No se pueden eliminar ${withProducts.length} categoría(s) porque tienen servicios asociados (${withProducts.map((c) => c.name).join(', ')}).`,
        };
    }

    await prisma.productCategory.deleteMany({ where: { id: { in: ids } } });
    await audit(admin, 'CATEGORIAS_PRODUCTO_ELIMINADAS_MASIVO', 'product_category', `${categories.length} categorías`, categories.map((c) => c.name).join(', '));
    revalidatePath('/productos');
    revalidatePath('/productos/categorias');
    return { success: `${categories.length} categorías eliminadas exitosamente.` };
}

/** Activación o desactivación masiva de categorías seleccionadas. */
export async function bulkToggleProductCategories(ids: number[], active: boolean): Promise<ProductCategoryFormState> {
    const admin = await requireAdmin();
    if (!ids.length) return { error: 'No se seleccionaron categorías.' };

    await prisma.productCategory.updateMany({
        where: { id: { in: ids } },
        data: { active },
    });

    const action = active ? 'CATEGORIAS_PRODUCTO_ACTIVADAS_MASIVO' : 'CATEGORIAS_PRODUCTO_DESACTIVADAS_MASIVO';
    await audit(admin, action, 'product_category', `${ids.length} categorías`, `Estado: ${active ? 'Activa' : 'Inactiva'}`);
    revalidatePath('/productos');
    revalidatePath('/productos/categorias');
    return { success: `${ids.length} categorías ${active ? 'activadas' : 'desactivadas'} exitosamente.` };
}
