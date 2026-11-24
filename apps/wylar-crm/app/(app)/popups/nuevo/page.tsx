import { prisma } from '@/lib/prisma';
import { PopupForm } from '@/components/PopupForm';

export default async function NuevoPopupPage() {
    const dbProfiles = await prisma.profile.findMany({ select: { id: true, title: true, slug: true }, orderBy: { title: 'asc' } });
    const profiles = dbProfiles.map((p) => ({ id: p.id, title: p.title, link: `/perfil/${p.slug}` }));

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Nuevo pop-up</h1>
                <p className="text-slate-500 text-sm mt-1">Recuerda revisar el resultado en wylar.cl una vez publicado.</p>
            </div>
            <PopupForm profiles={profiles} />
        </div>
    );
}
