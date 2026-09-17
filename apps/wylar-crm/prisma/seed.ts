// Datos de ejemplo. Ejecutar con: npm run db:seed
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';

// Ver nota en src/lib/prisma.ts: necesario en Node.js para que funcionen
// las transacciones del driver serverless de Neon.
neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? '1234'; // cambiar tras el primer login

const USERS = [
    { name: 'Admin Wylar', email: 'admin@wylar.cl', role: 'ADMIN' },
    { name: 'Camila Rojas', email: 'camila.rojas@wylar.cl', role: 'COMERCIAL' },
    { name: 'Matías Fuentes', email: 'matias.fuentes@wylar.cl', role: 'COMERCIAL' },
];

async function main() {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    const createdUsers = [];
    for (const u of USERS) {
        const user = await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash } });
        createdUsers.push(user);
    }
    const [admin, camila, matias] = createdUsers;

    const existingLeads = await prisma.lead.count();
    if (existingLeads === 0) {
        const seedLeads = [
            {
                type: 'PERSONA', name: 'Juan Pérez', email: 'juan.perez@ejemplo.cl', phone: '+569 1234 5678',
                certificationInterest: 'Instalador Eléctrico Clase D', message: 'Quisiera saber cuánto dura el proceso y el valor.',
                source: 'WEB', status: 'NUEVO', assignedToId: null, ageHours: 2,
            },
            {
                type: 'EMPRESA', name: 'Rodrigo Vidal', company: 'Constructora Vidal Ltda.', email: 'rvidal@constructoravidal.cl', phone: '+569 8765 4321',
                certificationInterest: 'Operador Rigger', message: 'Necesitamos certificar a 8 operadores de nuestra faena.',
                source: 'FACEBOOK', status: 'EN_ATENCION', assignedToId: camila.id, ageHours: 30, attended: true,
            },
            {
                type: 'PERSONA', name: 'María Contreras', email: 'maria.contreras@ejemplo.cl', phone: '+569 1111 2222',
                certificationInterest: 'Cuidador(a) de Personas Mayores', message: null,
                source: 'INSTAGRAM', status: 'SEGUIMIENTO', assignedToId: matias.id, ageHours: 72, attended: true,
            },
            {
                type: 'INSTITUCION', name: 'Sofía Muñoz', company: 'Liceo Técnico San Andrés', email: 'sofia.munoz@liceosa.cl', phone: '+569 3333 4444',
                certificationInterest: 'Convenio de certificación para egresados', message: 'Somos un liceo técnico y queremos evaluar un convenio.',
                source: 'WEB', status: 'CERRADO', assignedToId: admin.id, ageHours: 240, attended: true, closed: true,
            },
        ];

        for (const s of seedLeads) {
            const createdAt = new Date(Date.now() - s.ageHours * 60 * 60 * 1000);
            const firstAttendedAt = s.attended ? new Date(createdAt.getTime() + 45 * 60 * 1000) : null;
            const closedAt = s.closed ? new Date() : null;

            const lead = await prisma.lead.create({
                data: {
                    code: 'TEMP',
                    type: s.type,
                    name: s.name,
                    company: s.company ?? null,
                    email: s.email,
                    phone: s.phone,
                    certificationInterest: s.certificationInterest,
                    message: s.message,
                    source: s.source,
                    sourceDetail: `Semilla de ejemplo (${s.source})`,
                    status: s.status,
                    assignedToId: s.assignedToId,
                    createdAt,
                    firstAttendedAt,
                    closedAt,
                },
            });
            await prisma.lead.update({ where: { id: lead.id }, data: { code: `LEAD-${1000 + lead.id}` } });

            await prisma.leadActivity.create({
                data: { leadId: lead.id, userId: null, authorName: 'Sistema', type: 'CREACION', text: `Prospecto ingresado automáticamente desde el sitio web (canal: ${s.source}).`, createdAt },
            });
            if (s.attended && s.assignedToId) {
                const author = createdUsers.find((u) => u.id === s.assignedToId)!;
                await prisma.leadActivity.create({
                    data: { leadId: lead.id, userId: author.id, authorName: author.name, type: 'LLAMADA', text: 'Se contactó telefónicamente para levantar el requerimiento.', createdAt: firstAttendedAt! },
                });
            }
        }
    }

    console.log(`Usuarios listos. Contraseña de todos: "${SEED_PASSWORD}" (cámbiala después del primer login).`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
