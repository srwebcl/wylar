import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { PopupTable } from '@/components/PopupTable';

export default async function PopupsPage() {
    const currentUser = await requireUser();
    const popups = await prisma.popup.findMany({ orderBy: { createdAt: 'desc' } });

    return (
        <div>
            <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pop-ups</h1>
                    <p className="text-slate-500 text-sm mt-1 max-w-2xl">
                        Ventanas emergentes promocionales de wylar.cl. Los cambios se ven en el sitio en 5 a 30 minutos.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                        href="/popups/nuevo"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Nuevo pop-up
                    </Link>
                </div>
            </div>

            <PopupTable
                isAdmin={currentUser.role === 'ADMIN'}
                popups={popups.map((p) => ({
                    id: p.id,
                    title: p.title,
                    image: p.image,
                    active: p.active,
                    linkType: p.linkType as 'NONE' | 'INTERNAL' | 'EXTERNAL',
                    linkHref: p.linkHref,
                    showOnAllPages: p.showOnAllPages,
                    pages: p.pages,
                    showOnProfilePages: p.showOnProfilePages,
                }))}
            />
        </div>
    );
}
