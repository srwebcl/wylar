// Cliente del Catálogo de Productos del CRM (distinto del Catálogo de
// Perfiles en catalog.js). Alimenta el selector obligatorio de "Producto /
// servicio de interés" de los formularios de contacto, y permite resolver
// qué producto corresponde a una ficha de perfil (vía profileSlug).
const CRM_ORIGIN = import.meta.env.PUBLIC_CRM_ORIGIN || 'https://wylar-crm.vercel.app';

let lastGoodProducts = [];

/** Lista de productos activos: { id, name, categoryId, categoryName, profileSlug }. */
export async function getProductList() {
    try {
        const res = await fetch(`${CRM_ORIGIN}/api/public/products`, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'No se pudo cargar el catálogo de productos del CRM.');
        lastGoodProducts = data.products;
        return data.products;
    } catch (error) {
        if (lastGoodProducts.length === 0 && !process.env.AWS_LAMBDA_FUNCTION_NAME) throw error;
        console.error('[products] CRM no disponible, se usa el último catálogo conocido:', error?.message ?? error);
        return lastGoodProducts;
    }
}

/** Producto ligado a una ficha de perfil (por slug), si existe — usado por
 * SidebarForm/ContactModal para resolver automáticamente el productId. */
export async function getProductForProfile(slug) {
    const products = await getProductList();
    return products.find((p) => p.profileSlug === slug) ?? null;
}
