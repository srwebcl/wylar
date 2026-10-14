'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/auth';
import { productSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export interface ProductFormState {
    error?: string;
    success?: string;
}

function parseInput(formData: FormData) {
    const attributesRaw = formData.get('attributes');
    let attributes: Record<string, string> | null = null;
    if (typeof attributesRaw === 'string' && attributesRaw.trim()) {
        try {
            attributes = JSON.parse(attributesRaw);
        } catch {
            attributes = null;
        }
    }
    return productSchema.safeParse({
        categoryId: formData.get('categoryId'),
        name: formData.get('name'),
        description: formData.get('description') || null,
        price: formData.get('price') || null,
        profileId: formData.get('profileId') || null,
        attributes,
    });
}

/** Crear exige solo sesión; editar y desactivar/eliminar exigen ADMIN —
 * mismo patrón que certificateMeta.ts/CertificateManagement.tsx. */
export async function createProduct(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    const user = await requireUser();
    const parsed = parseInput(formData);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del producto.' };
    const data = parsed.data;

    await prisma.product.create({
        data: {
            categoryId: data.categoryId,
            name: data.name,
            description: data.description || null,
            price: data.price ?? null,
            profileId: data.profileId || null,
            attributes: data.attributes ?? undefined,
        },
    });

    await audit(user, 'PRODUCTO_CREADO', 'producto', data.name);
    revalidatePath('/productos');
    return { success: 'Producto creado.' };
}

export async function updateProduct(productId: number, _prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    const admin = await requireAdmin();
    const parsed = parseInput(formData);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del producto.' };
    const data = parsed.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { error: 'El producto no existe.' };

    await prisma.product.update({
        where: { id: productId },
        data: {
            categoryId: data.categoryId,
            name: data.name,
            description: data.description || null,
            price: data.price ?? null,
            profileId: data.profileId || null,
            attributes: data.attributes ?? undefined,
        },
    });

    await audit(admin, 'PRODUCTO_EDITADO', 'producto', data.name, `antes: ${product.name}`);
    revalidatePath('/productos');
    return { success: 'Producto actualizado.' };
}

/** No se borra (puede tener oportunidades/cotizaciones históricas que lo
 * referencian) — se activa/desactiva, igual que un certificado se revoca en
 * vez de borrarse. Un producto inactivo deja de ofrecerse en los
 * formularios nuevos pero no altera lo ya vendido. */
export async function toggleProductActive(productId: number): Promise<ProductFormState> {
    const admin = await requireAdmin();
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { error: 'El producto no existe.' };

    await prisma.product.update({ where: { id: productId }, data: { active: !product.active } });
    await audit(admin, product.active ? 'PRODUCTO_DESACTIVADO' : 'PRODUCTO_ACTIVADO', 'producto', product.name);
    revalidatePath('/productos');
    return { success: product.active ? 'Producto desactivado.' : 'Producto activado.' };
}
