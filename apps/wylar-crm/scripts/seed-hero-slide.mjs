import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

async function main() {
    const count = await prisma.heroSlide.count();
    if (count > 0) {
        console.log(`Ya hay ${count} slide(s), no se siembra nada.`);
        return;
    }

    await prisma.heroSlide.create({
        data: {
            order: 0,
            active: true,
            image: '/images/hero_principal.jpg',
            eyebrowLead: 'Centro Acreditado',
            eyebrowAccent: 'ChileValora',
            title: 'Certificamos tus',
            titleHighlight: 'competencias laborales.',
            description: 'Evaluamos y certificamos lo que sabes hacer con procesos confiables y respaldo oficial. Para personas, empresas e instituciones de educación en todo Chile.',
            ctaLabel: 'Quiero Certificarme',
            ctaHref: '/#portales',
        },
    });
    console.log('Slide principal creado.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
