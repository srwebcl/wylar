// Respaldo lógico de las tablas con datos de negocio a archivos JSON.
// Uso: node --env-file=.env.local scripts/backup.mjs   (npm run db:backup)
// Los respaldos se guardan en backups/ (ignorado por git). Guárdalos fuera de
// tu computador también (Drive, disco externo): contienen datos personales.
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const dir = `backups/${stamp}`;
fs.mkdirSync(dir, { recursive: true });

const tables = {
    users: () => prisma.user.findMany(),
    leads: () => prisma.lead.findMany(),
    lead_activities: () => prisma.leadActivity.findMany(),
    profiles: () => prisma.profile.findMany({ include: { sections: { include: { items: true } }, faqs: true } }),
    certificates: () => prisma.certificate.findMany(),
    hero_slides: () => prisma.heroSlide.findMany(),
};

for (const [name, fetchRows] of Object.entries(tables)) {
    const rows = await fetchRows();
    fs.writeFileSync(`${dir}/${name}.json`, JSON.stringify(rows, null, 2));
    console.log(`${name}: ${rows.length} filas`);
}
console.log(`Respaldo guardado en ${dir}`);
await prisma.$disconnect();
