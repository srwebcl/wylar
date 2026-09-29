'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { deleteBlobIfUnused } from '@/lib/blob';
import { sanitizeRichText } from '@/lib/sanitizeHtml';
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
    const currentUser = await requireUser();

    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del perfil.' };
    }
    const data = parsed.data;

    const existingSlug = await prisma.profile.findUnique({ where: { slug: data.slug } });
    if (existingSlug && existingSlug.id !== profileId) {
        return { error: `El slug "${data.slug}" ya está en uso por otro perfil.` };
    }

    const prev = profileId ? (await prisma.profile.findUnique({ where: { id: profileId }, select: { image: true, cardImage: true } })) : null;
    const previousImage = prev?.image;
    const previousCardImage = prev?.cardImage;

    const profileData = {
        slug: data.slug,
        templateType: data.templateType,
        title: data.title,
        description: data.description,
        image: data.image,
        cardImage: data.cardImage || null,
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
            // La plantilla ESTANDAR guarda HTML del editor y el sitio lo muestra
            // con set:html: se sanea aquí. Las demás plantillas guardan texto plano.
            const text = data.templateType === 'ESTANDAR' && section.text ? sanitizeRichText(section.text) : section.text;
            await tx.profileSection.create({
                data: {
                    profileId: profile.id,
                    key: section.key,
                    order: section.order,
                    title: section.title || null,
                    text: text || null,
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

    if (previousImage && previousImage !== data.image) await deleteBlobIfUnused(previousImage);
    if (previousCardImage && previousCardImage !== data.cardImage) await deleteBlobIfUnused(previousCardImage);
    await audit(currentUser, profileId ? 'PERFIL_ACTUALIZADO' : 'PERFIL_CREADO', 'perfil', data.slug, data.title);
    revalidatePath('/catalogo');
    return { success: profileId ? 'Perfil actualizado.' : 'Perfil creado.' };
}

/** Eliminar un perfil es irreversible: solo ADMIN. */
export async function deleteProfile(profileId: number): Promise<CatalogFormState> {
    const admin = await requireAdmin();
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) return { error: 'El perfil no existe.' };
    await prisma.profile.delete({ where: { id: profileId } });
    await deleteBlobIfUnused(profile.image);
    if (profile.cardImage) await deleteBlobIfUnused(profile.cardImage);
    await audit(admin, 'PERFIL_ELIMINADO', 'perfil', profile.slug, profile.title);
    revalidatePath('/catalogo');
    return { success: 'Perfil eliminado.' };
}
