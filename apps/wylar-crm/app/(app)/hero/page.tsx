import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { HeroSlideTable } from '@/components/HeroSlideTable';

export default async function HeroPage() {
    const currentUser = await requireUser();
    const slides = await prisma.heroSlide.findMany({ orderBy: { order: 'asc' } });

    return (
        <div>
            <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Hero del Home</h1>
                    <p className="text-slate-500 text-sm mt-1 max-w-2xl">
                        Slides personalizados del hero de wylar.cl. Se muestran en este orden, seguidos automáticamente por un slide
                        por cada perfil del catálogo marcado como &ldquo;Destacado&rdquo; (eso se administra en Catálogo, no acá). Los cambios se ven en el sitio en 1 a 3 minutos.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                        href="/hero/nuevo"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0B1E40] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Nuevo slide
                    </Link>
                </div>
            </div>

            <HeroSlideTable
                isAdmin={currentUser.role === 'ADMIN'}
                slides={slides.map((s) => ({ id: s.id, image: s.image, title: s.title, titleHighlight: s.titleHighlight, active: s.active }))}
            />
        </div>
    );
}
