import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProfileForm, type ProfileFormInitial } from '@/components/ProfileForm';

export default async function EditarPerfilPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const profileId = Number(id);
    if (!Number.isInteger(profileId)) notFound();

    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: {
            sections: { orderBy: { order: 'asc' }, include: { items: { orderBy: { order: 'asc' } } } },
            faqs: { orderBy: { order: 'asc' } },
        },
    });
    if (!profile) notFound();

    const initial: ProfileFormInitial = {
        id: profile.id,
        slug: profile.slug,
        templateType: profile.templateType,
        title: profile.title,
        description: profile.description,
        image: profile.image,
        category: profile.category,
        sector: profile.sector,
        subsector: profile.subsector,
        nivel: profile.nivel,
        vigencia: profile.vigencia ?? '',
        target: profile.target,
        isChileValora: profile.isChileValora,
        isFeatured: profile.isFeatured,
        active: profile.active,
        heroHook: profile.heroHook,
        heroParagraphs: profile.heroParagraphs,
        heroCta: profile.heroCta ?? '',
        sections: profile.sections.map((s) => ({
            key: s.key,
            title: s.title ?? '',
            text: s.text ?? '',
            intro: s.intro ?? '',
            closing: s.closing ?? '',
            note: s.note ?? '',
            items: s.items.map((it) => ({ group: it.group ?? '', code: it.code ?? '', title: it.title ?? '', text: it.text ?? '' })),
        })),
        faqs: profile.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Editar perfil</h1>
                <p className="text-slate-500 text-sm mt-1">{profile.title}</p>
            </div>
            <ProfileForm initial={initial} />
        </div>
    );
}
