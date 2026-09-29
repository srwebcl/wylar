import { HeroSlideForm } from '@/components/HeroSlideForm';
import { prisma } from '@/lib/prisma';

export default async function NuevoHeroSlidePage() {
    const dbProfiles = await prisma.profile.findMany({ select: { id: true, title: true, slug: true }, orderBy: { title: 'asc' } });
    const profiles = dbProfiles.map(p => ({ id: p.id, title: p.title, link: `/perfil/${p.slug}` }));
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Nuevo slide del hero</h1>
                <p className="text-slate-500 text-sm mt-1">Recuerda publicar los cambios en wylar.cl desde el listado una vez que termines.</p>
            </div>
            <HeroSlideForm profiles={profiles} />
        </div>
    );
}
