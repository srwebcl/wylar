import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PopupForm } from '@/components/PopupForm';

export default async function EditarPopupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const popupId = Number(id);
    if (!Number.isInteger(popupId)) notFound();

    const popup = await prisma.popup.findUnique({ where: { id: popupId } });
    if (!popup) notFound();

    const dbProfiles = await prisma.profile.findMany({ select: { id: true, title: true, slug: true }, orderBy: { title: 'asc' } });
    const profiles = dbProfiles.map((p) => ({ id: p.id, title: p.title, link: `/perfil/${p.slug}` }));

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Editar pop-up</h1>
                <p className="text-slate-500 text-sm mt-1">{popup.title}</p>
            </div>
            <PopupForm
                profiles={profiles}
                initial={{
                    id: popup.id,
                    title: popup.title,
                    active: popup.active,
                    image: popup.image,
                    imageWidth: popup.imageWidth,
                    imageHeight: popup.imageHeight,
                    linkType: popup.linkType as 'NONE' | 'INTERNAL' | 'EXTERNAL',
                    linkHref: popup.linkHref,
                    showOnAllPages: popup.showOnAllPages,
                    pages: popup.pages,
                    showOnProfilePages: popup.showOnProfilePages,
                }}
            />
        </div>
    );
}
