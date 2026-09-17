'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { heroSlideSchema, type HeroSlideInput } from '@/lib/validation';

export interface HeroFormState {
    error?: string;
    success?: string;
}

/** Crea o actualiza un slide del hero. */
export async function saveHeroSlide(input: HeroSlideInput, slideId?: number | null): Promise<HeroFormState> {
    await requireUser();

    const parsed = heroSlideSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del slide.' };
    }
    const data = parsed.data;

    if (slideId) {
        await prisma.heroSlide.update({ where: { id: slideId }, data });
    } else {
        await prisma.heroSlide.create({ data });
    }

    revalidatePath('/hero');
    return { success: slideId ? 'Slide actualizado.' : 'Slide creado.' };
}

export async function deleteHeroSlide(slideId: number): Promise<HeroFormState> {
    await requireUser();
    await prisma.heroSlide.delete({ where: { id: slideId } });
    revalidatePath('/hero');
    return { success: 'Slide eliminado.' };
}

/** Activa/desactiva un slide sin borrarlo (para pausarlo temporalmente). */
export async function toggleHeroSlideActive(slideId: number) {
    await requireUser();
    const slide = await prisma.heroSlide.findUniqueOrThrow({ where: { id: slideId } });
    await prisma.heroSlide.update({ where: { id: slideId }, data: { active: !slide.active } });
    revalidatePath('/hero');
}

/** Sube o baja un slide un puesto (intercambia su `order` con el vecino). */
export async function reorderHeroSlide(slideId: number, direction: 'up' | 'down') {
    await requireUser();
    const slides = await prisma.heroSlide.findMany({ orderBy: { order: 'asc' } });
    const index = slides.findIndex((s) => s.id === slideId);
    if (index === -1) return;

    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= slides.length) return;

    const a = slides[index];
    const b = slides[swapWith];
    await prisma.$transaction([
        prisma.heroSlide.update({ where: { id: a.id }, data: { order: b.order } }),
        prisma.heroSlide.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);

    revalidatePath('/hero');
}
