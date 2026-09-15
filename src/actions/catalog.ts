'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { profileSchema, type ProfileInput } from '@/lib/validation';

export interface CatalogFormState {
    error?: string;
    success?: string;
}

/**
 * Módulo de Catálogo: crea o actualiza un perfil, junto con todas sus
 * secciones/ítems/FAQ. Dado que la cantidad de secciones e ítems es
 * dinámica (depende de la plantilla, ver src/lib/catalogSpec.ts), en un
 * update se borran y recrean las secciones/ítems/FAQ dentro de la misma
 * transacción en vez de intentar diferenciar fila por fila — el catálogo
 * tiene un puñado de perfiles, no millones de filas, así que el costo es
 * insignificante.
 */
export async function saveProfile(input: ProfileInput, profileId?: number | null): Promise<CatalogFormState> {
    await requireUser();

    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del perfil.' };
    }
    const data = parsed.data;

    const existingSlug = await prisma.profile.findUnique({ where: { slug: data.slug } });
    if (existingSlug && existingSlug.id !== profileId) {
        return { error: `El slug "${data.slug}" ya está en uso por otro perfil.` };
    }

    const profileData = {
        slug: data.slug,
        templateType: data.templateType,
        title: data.title,
        description: data.description,
        image: data.image,
        category: data.category,
        sector: data.sector,
        subsector: data.subsector,
        nivel: data.nivel,
        vigencia: data.vigencia || null,
        target: data.target,
        isChileValora: data.isChileValora,
        isFeatured: data.isFeatured,
        active: data.active,
        heroHook: data.heroHook,
        heroParagraphs: data.heroParagraphs,
        heroCta: data.heroCta || null,
    };

    await prisma.$transaction(async (tx) => {
        const profile = profileId
            ? await tx.profile.update({ where: { id: profileId }, data: profileData })
            : await tx.profile.create({ data: profileData });

        await tx.profileSection.deleteMany({ where: { profileId: profile.id } });
        await tx.profileFaq.deleteMany({ where: { profileId: profile.id } });

        for (const section of data.sections) {
            await tx.profileSection.create({
                data: {
                    profileId: profile.id,
                    key: section.key,
                    order: section.order,
                    title: section.title || null,
                    text: section.text || null,
                    intro: section.intro || null,
                    closing: section.closing || null,
                    note: section.note || null,
                    items: {
                        create: section.items.map((item) => ({
                            order: item.order,
                            group: item.group || null,
                            code: item.code || null,
                            title: item.title || null,
                            text: item.text || null,
                        })),
                    },
                },
            });
        }

        if (data.faqs.length > 0) {
            await tx.profileFaq.createMany({
                data: data.faqs.map((faq) => ({ profileId: profile.id, order: faq.order, question: faq.question, answer: faq.answer })),
            });
        }
    });

    revalidatePath('/catalogo');
    return { success: profileId ? 'Perfil actualizado.' : 'Perfil creado.' };
}

export async function deleteProfile(profileId: number): Promise<CatalogFormState> {
    await requireUser();
    await prisma.profile.delete({ where: { id: profileId } });
    revalidatePath('/catalogo');
    return { success: 'Perfil eliminado.' };
}
