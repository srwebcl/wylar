import Link from 'next/link';
import { Plus, Info, ArrowRight, Globe } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { profileTemplateLabel } from '@/lib/catalogSpec';
import { CatalogTable } from '@/components/CatalogTable';

export default async function CatalogoPage() {
    const currentUser = await requireUser();
    const profiles = await prisma.profile.findMany({
        orderBy: [{ isFeatured: 'desc' }, { title: 'asc' }],
        include: {
            products: {
                select: {
                    id: true,
                    name: true,
                    price: true,
                    category: { select: { name: true } },
                },
            },
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Globe size={24} className="text-blue-600" />
                        <h1 className="text-2xl font-bold text-slate-900">Fichas web (landing pages)</h1>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        Páginas y contenido de marketing exhibidos en el sitio wylar.cl. Cada ficha se asocia con un ítem del Catálogo comercial maestro.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                        href="/catalogo/nuevo"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
                    >
                        <Plus size={18} /> Nueva ficha web
                    </Link>
                </div>
            </div>

            {/* Banner explicativo de unificación con Catálogo comercial */}
            <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-[#0B1E40]">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
                        <Info size={18} />
                    </div>
                    <div>
                        <span className="font-bold">¿Buscas administrar precios, cotizaciones o categorías comerciales?</span>
                        <p className="text-xs text-slate-600 mt-0.5">
                            El maestro comercial de servicios está centralizado en el módulo <strong>Catálogo</strong> del CRM.
                        </p>
                    </div>
                </div>
                <Link
                    href="/productos"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-800 font-bold text-xs hover:bg-blue-50 transition-colors shrink-0 shadow-sm"
                >
                    Ir al Catálogo de servicios <ArrowRight size={13} />
                </Link>
            </div>

            <CatalogTable
                isAdmin={currentUser.role === 'ADMIN'}
                profiles={profiles.map((p) => ({
                    id: p.id,
                    slug: p.slug,
                    title: p.title,
                    category: p.category,
                    templateLabel: profileTemplateLabel(p.templateType),
                    isFeatured: p.isFeatured,
                    active: p.active,
                    linkedProduct: p.products[0]
                        ? {
                              id: p.products[0].id,
                              name: p.products[0].name,
                              categoryName: p.products[0].category.name,
                              price: p.products[0].price != null ? Number(p.products[0].price) : null,
                          }
                        : null,
                }))}
            />
        </div>
    );
}
