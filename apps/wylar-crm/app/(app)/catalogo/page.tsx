import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { profileTemplateLabel } from '@/lib/catalogSpec';
import { CatalogTable } from '@/components/CatalogTable';

export default async function CatalogoPage() {
    const profiles = await prisma.profile.findMany({ orderBy: [{ isFeatured: 'desc' }, { title: 'asc' }] });

    return (
        <div>
            <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Catálogo</h1>
                    <p className="text-slate-500 text-sm mt-1">Perfiles/certificaciones que se exhiben en wylar.cl (GET /api/public/catalog).</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <Link
                        href="/catalogo/nuevo"
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-colors"
                    >
                        <Plus size={18} /> Nuevo perfil
                    </Link>
                </div>
            </div>

            <CatalogTable
                profiles={profiles.map((p) => ({
                    id: p.id,
                    slug: p.slug,
                    title: p.title,
                    category: p.category,
                    templateLabel: profileTemplateLabel(p.templateType),
                    isFeatured: p.isFeatured,
                    active: p.active,
                }))}
            />
        </div>
    );
}
