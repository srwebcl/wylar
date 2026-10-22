import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

function formatChileanMobile(raw) {
    if (!raw) return null;
    let digits = String(raw).replace(/\D/g, '');
    if (digits.startsWith('56')) digits = digits.slice(2);
    if (digits.length === 8) digits = `9${digits}`;
    if (digits.length !== 9 || !digits.startsWith('9')) return null;
    const subscriber = digits.slice(1);
    return `+56 9 ${subscriber.slice(0, 4)} ${subscriber.slice(4)}`;
}

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function main() {
    console.log('--- Iniciando normalización de datos existentes ---');

    // 1. Leads
    const leads = await prisma.lead.findMany();
    console.log(`Leads encontrados: ${leads.length}`);
    let leadsUpdated = 0;
    for (const lead of leads) {
        const newName = lead.name.trim().toUpperCase();
        const newEmail = lead.email.trim().toLowerCase();
        const newPhone = formatChileanMobile(lead.phone) || lead.phone;
        const newCompany = lead.company ? lead.company.trim().toUpperCase() : null;

        if (
            newName !== lead.name ||
            newEmail !== lead.email ||
            newPhone !== lead.phone ||
            newCompany !== lead.company
        ) {
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    name: newName,
                    email: newEmail,
                    phone: newPhone,
                    company: newCompany,
                },
            });
            leadsUpdated++;
        }
    }
    console.log(`Leads actualizados: ${leadsUpdated}`);

    // 2. Clientes
    const clients = await prisma.client.findMany();
    console.log(`Clientes encontrados: ${clients.length}`);
    let clientsUpdated = 0;
    for (const client of clients) {
        const newName = client.name.trim().toUpperCase();
        const newEmail = client.email.trim().toLowerCase();
        const newPhone = formatChileanMobile(client.phone) || client.phone;
        const newCompany = client.company ? client.company.trim().toUpperCase() : null;

        if (
            newName !== client.name ||
            newEmail !== client.email ||
            newPhone !== client.phone ||
            newCompany !== client.company
        ) {
            await prisma.client.update({
                where: { id: client.id },
                data: {
                    name: newName,
                    email: newEmail,
                    phone: newPhone,
                    company: newCompany,
                },
            });
            clientsUpdated++;
        }
    }
    console.log(`Clientes actualizados: ${clientsUpdated}`);

    // 3. Contactos de clientes
    const contacts = await prisma.clientContact.findMany();
    console.log(`Contactos encontrados: ${contacts.length}`);
    let contactsUpdated = 0;
    for (const contact of contacts) {
        const newName = contact.name.trim().toUpperCase();
        const newEmail = contact.email ? contact.email.trim().toLowerCase() : null;
        const newPhone = contact.phone ? (formatChileanMobile(contact.phone) || contact.phone) : null;

        if (
            newName !== contact.name ||
            newEmail !== contact.email ||
            newPhone !== contact.phone
        ) {
            await prisma.clientContact.update({
                where: { id: contact.id },
                data: {
                    name: newName,
                    email: newEmail,
                    phone: newPhone,
                },
            });
            contactsUpdated++;
        }
    }
    console.log(`Contactos actualizados: ${contactsUpdated}`);

    // 4. Certificados
    const certs = await prisma.certificate.findMany();
    console.log(`Certificados encontrados: ${certs.length}`);
    let certsUpdated = 0;
    for (const cert of certs) {
        const newHolder = cert.holderName.trim().toUpperCase();
        if (newHolder !== cert.holderName) {
            await prisma.certificate.update({
                where: { id: cert.id },
                data: { holderName: newHolder },
            });
            certsUpdated++;
        }
    }
    console.log(`Certificados actualizados: ${certsUpdated}`);

    console.log('--- Normalización completada con éxito ---');
}

main()
    .catch((err) => {
        console.error('Error durante normalización:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
