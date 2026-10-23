import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { profileTemplateLabel } from '@/lib/catalogSpec';
import { CatalogTable } from '@/components/CatalogTable';

export default async function CatalogoPage() {
    const currentUser = await requireUser();
    const profiles = await prisma.profile.findMany({
        orderBy: [{ isFeatured: 'desc' }, { title: 'asc' }],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Catálogo</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Perfiles y certificaciones que se exhiben en el sitio web (wylar.cl). Los cambios se ven en 1 a 3 minutos.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                        href="/catalogo/nuevo"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
                    >
                        <Plus size={18} /> Nuevo perfil
                    </Link>
                </div>
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
                }))}
            />
        </div>
    );
}
