import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { HeroSlideForm } from '@/components/HeroSlideForm';

export default async function EditarHeroSlidePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const slideId = Number(id);
    if (!Number.isInteger(slideId)) notFound();

    const slide = await prisma.heroSlide.findUnique({ where: { id: slideId } });
    if (!slide) notFound();

    const dbProfiles = await prisma.profile.findMany({ select: { id: true, title: true, slug: true }, orderBy: { title: 'asc' } });
    const profiles = dbProfiles.map(p => ({ id: p.id, title: p.title, link: `/perfil/${p.slug}` }));

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Editar slide del hero</h1>
                <p className="text-slate-500 text-sm mt-1">{slide.title} {slide.titleHighlight}</p>
            </div>
            <HeroSlideForm
                profiles={profiles}
                initial={{
                    id: slide.id,
                    order: slide.order,
                    active: slide.active,
                    image: slide.image,
                    eyebrowLead: slide.eyebrowLead,
                    eyebrowAccent: slide.eyebrowAccent,
                    title: slide.title,
                    titleHighlight: slide.titleHighlight,
                    description: slide.description,
                    ctaLabel: slide.ctaLabel,
                    ctaHref: slide.ctaHref,
                }}
            />
        </div>
    );
}
