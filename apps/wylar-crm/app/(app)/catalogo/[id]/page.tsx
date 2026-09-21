import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProfileForm, type ProfileFormInitial } from '@/components/ProfileForm';
import { ProfileWizard, type ProfileWizardInitial } from '@/components/ProfileWizard';
import { ESTANDAR_SECTION_KEYS } from '@/lib/catalogSpec';

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

    // La plantilla ESTANDAR (formulario paso a paso) tiene una forma de
    // datos distinta y más simple que CHILEVALORA/SOLDADURA/OPERADORES
    // (esas 3 siguen editándose con el formulario dinámico de siempre,
    // ProfileForm — su contenido no encaja en los 6 bloques fijos de
    // ESTANDAR sin perder información).
    if (profile.templateType === 'ESTANDAR') {
        const byKey = Object.fromEntries(profile.sections.map((s) => [s.key, s]));
        const initial: ProfileWizardInitial = {
            id: profile.id,
            slug: profile.slug,
            title: profile.title,
            description: profile.description,
            descriptionLong: byKey.descriptionLong?.text ?? '',
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
            sections: Object.fromEntries(ESTANDAR_SECTION_KEYS.map((key) => [key, byKey[key]?.text ?? ''])) as Record<(typeof ESTANDAR_SECTION_KEYS)[number], string>,
            faqs: profile.faqs.map((f) => ({ question: f.question, answer: f.answer })),
        };

        return (
            <div>
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-slate-900">Editar perfil</h1>
                    <p className="text-slate-500 text-sm mt-1">{profile.title}</p>
                </div>
                <ProfileWizard initial={initial} />
            </div>
        );
    }

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
