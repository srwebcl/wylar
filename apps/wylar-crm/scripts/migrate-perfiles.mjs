// Migra los 4 perfiles hardcodeados en apps/wylar/src/data/perfiles.js hacia
// el Módulo de Catálogo del CRM (Profile/ProfileSection/ProfileSectionItem/
// ProfileFaq — ver prisma/schema.prisma y src/lib/catalogSpec.ts).
//
// Uso: cp .env.local .env && node scripts/migrate-perfiles.mjs && rm .env
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { perfiles } from '../../wylar/src/data/perfiles.js';

neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

const t = (text) => ({ text });
const titled = (title, text) => ({ title, text });
const coded = (code, text) => ({ code, text });
const grouped = (group, text) => ({ group, text });

// Arma las secciones (en el orden de catalogSpec) para cada tipo de plantilla.
function buildSections(p) {
    if (p.type === 'chilevalora') {
        const sections = [
            { key: 'importante', text: p.importante.noEsCurso, intro: p.importante.tituloIntro, closing: p.importante.tituloClosing, items: p.importante.tituloBullets.map(t) },
            { key: 'quienesPueden', intro: p.quienesPueden.intro, closing: p.quienesPueden.closing, items: p.quienesPueden.bullets.map(t) },
            { key: 'ucls', intro: p.queSeEvaluaIntro, items: p.ucls.map((u) => titled(u.title, u.description)) },
            { key: 'queEs', text: p.queEs, items: [] },
            { key: 'porQueCertificar', closing: p.porQueCertificar.closing, items: p.porQueCertificar.bullets.map(t) },
            { key: 'proceso', items: p.proceso.map((s) => titled(s.title, s.description)) },
            { key: 'cierre', title: p.cierre.title, note: p.cierre.cta, items: p.cierre.paragraphs.map(t) },
        ];
        if (p.alert) sections.push({ key: 'alert', title: p.alert.title, text: p.alert.description, items: [] });
        return sections;
    }

    if (p.type === 'soldadura') {
        return [
            { key: 'queEs', items: p.queEs.map(t) },
            { key: 'procesos', note: p.necesitasOtroProceso, items: p.procesos.map((x) => coded(x.code, x.name)) },
            { key: 'posiciones', note: p.posiciones.note, items: [...p.posiciones.placa.map((x) => grouped('placa', x)), ...p.posiciones.tuberia.map((x) => grouped('tuberia', x))] },
            { key: 'materiales', note: p.materiales.note, items: p.materiales.items.map(t) },
            { key: 'normas', title: p.normas.title, text: p.normas.text, items: [] },
            { key: 'aMedida', title: p.aMedida.title, text: p.aMedida.text, closing: p.aMedida.closing, items: p.aMedida.items.map(t) },
            { key: 'incluye', items: p.incluye.map(t) },
            { key: 'quienesPueden', items: p.quienesPueden.map((x) => titled(x.title, x.text)) },
            { key: 'proceso', items: p.proceso.map((s) => titled(s.title, s.description)) },
            { key: 'trazabilidad', title: p.trazabilidad.title, text: p.trazabilidad.text, closing: p.trazabilidad.closing, items: p.trazabilidad.items.map(t) },
            { key: 'cierre', title: p.cierre.title, closing: p.cierre.closing, items: p.cierre.items.map(t) },
        ];
    }

    // operadores
    return [
        { key: 'intro', title: p.intro.title, text: p.intro.text, items: [] },
        { key: 'necesitasOtro', text: p.necesitasOtro, items: [] },
        { key: 'aMedida', title: p.aMedida.title, text: p.aMedida.text, items: [] },
        { key: 'quienesPueden', items: p.quienesPueden.map((x) => titled(x.title, x.text)) },
        { key: 'proceso', items: p.proceso.map((s) => titled(s.title, s.description)) },
        { key: 'incluye', intro: p.incluye.intro, note: p.incluye.note, items: p.incluye.items.map(t) },
        { key: 'verificables', title: p.verificables.title, text: p.verificables.text, items: [] },
        { key: 'porQueCertificar', intro: p.porQueCertificar.intro, items: p.porQueCertificar.items.map(t) },
        { key: 'oportunidades', items: p.oportunidades.map((x) => titled(x.title, x.text)) },
        { key: 'cierre', title: p.cierre.title, closing: p.cierre.closing, items: p.cierre.items.map(t) },
    ];
}

const TEMPLATE_TYPE = { chilevalora: 'CHILEVALORA', soldadura: 'SOLDADURA', operadores: 'OPERADORES' };

async function main() {
    for (const p of perfiles) {
        const sections = buildSections(p);

        // Nota: se hizo con un solo $transaction envolvente al inicio, pero el
        // driver HTTP de Neon corta transacciones largas con muchas
        // sentencias anidadas (perfiles con ~10+ secciones, ver soldador) —
        // falla con "Foreign key constraint violated" a mitad de camino, no
        // por un dato inválido. Se hace secuencial en su lugar: cada
        // profileSection.create() (con sus items anidados) es su propia
        // transacción chica, y el script es idempotente (se puede re-correr
        // sin duplicar) porque igual borra y recrea secciones/FAQ primero.
        const profile = await prisma.profile.upsert({
            where: { slug: p.id },
            update: {},
            create: {
                slug: p.id,
                templateType: TEMPLATE_TYPE[p.type],
                title: p.title,
                description: p.description,
                image: p.image,
                category: p.category,
                sector: p.sector,
                subsector: p.subsector,
                nivel: p.nivel,
                vigencia: p.vigencia ?? null,
                target: p.target,
                isChileValora: p.isChileValora,
                isFeatured: p.isFeatured ?? false,
                heroHook: p.heroHook,
                heroParagraphs: p.heroParagraphs,
                heroCta: p.heroCta ?? null,
            },
        });

        await prisma.profileSection.deleteMany({ where: { profileId: profile.id } });
        await prisma.profileFaq.deleteMany({ where: { profileId: profile.id } });

        for (let i = 0; i < sections.length; i++) {
            const s = sections[i];
            console.log(`  · sección ${i}: ${s.key} (${(s.items ?? []).length} items)`);
            await prisma.profileSection.create({
                data: {
                    profileId: profile.id,
                    key: s.key,
                    order: i,
                    title: s.title ?? null,
                    text: s.text ?? null,
                    intro: s.intro ?? null,
                    closing: s.closing ?? null,
                    note: s.note ?? null,
                    items: {
                        create: (s.items ?? []).map((item, order) => ({
                            order,
                            group: item.group ?? null,
                            code: item.code ?? null,
                            title: item.title ?? null,
                            text: item.text ?? null,
                        })),
                    },
                },
            });
        }

        if (p.faq?.length) {
            await prisma.profileFaq.createMany({
                data: p.faq.map((f, order) => ({ profileId: profile.id, order, question: f.q, answer: f.a })),
            });
        }

        console.log(`✓ ${p.id} (${p.title})`);
    }

    console.log(`\nListo: ${perfiles.length} perfiles migrados.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
