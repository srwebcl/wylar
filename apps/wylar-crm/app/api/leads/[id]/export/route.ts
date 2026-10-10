import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { leadTypeLabel, sourceLabel, statusLabel, activityTypeLabel } from '@/lib/constants';

/** Exporta a Excel la ficha de un prospecto puntual + toda su bitácora de
 * gestiones (una hoja con los datos, otra con el historial completo). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    await requireUser();
    const { id } = await params;
    const leadId = Number(id);
    if (!Number.isInteger(leadId)) return new Response('Prospecto inválido.', { status: 400 });

    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { assignedTo: { select: { name: true } }, activities: { orderBy: { createdAt: 'asc' } } },
    });
    if (!lead) return new Response('Prospecto no encontrado.', { status: 404 });

    const workbook = new ExcelJS.Workbook();

    const summary = workbook.addWorksheet('Ficha');
    summary.columns = [
        { header: 'Campo', key: 'field', width: 24 },
        { header: 'Valor', key: 'value', width: 50 },
    ];
    summary.getRow(1).font = { bold: true };
    const fields: [string, string][] = [
        ['Código', lead.code],
        ['Tipo', leadTypeLabel(lead.type)],
        ['Nombre', lead.name],
        ['Empresa', lead.company ?? ''],
        ['Correo', lead.email],
        ['Teléfono', lead.phone],
        ['Certificación de interés', lead.certificationInterest ?? ''],
        ['Estado', statusLabel(lead.status)],
        ['Motivo desistimiento', lead.lostReason ?? ''],
        ['Origen', sourceLabel(lead.source)],
        ['Responsable', lead.assignedTo?.name ?? 'Sin asignar'],
        ['Fecha de ingreso', lead.createdAt.toLocaleString('es-CL')],
        ['Primera atención', lead.firstAttendedAt ? lead.firstAttendedAt.toLocaleString('es-CL') : 'Sin atender'],
        ['Fecha de cierre/desistimiento', lead.closedAt ? lead.closedAt.toLocaleString('es-CL') : ''],
        ['Mensaje original', lead.message ?? ''],
    ];
    for (const [field, value] of fields) summary.addRow({ field, value });

    const activitiesSheet = workbook.addWorksheet('Gestiones');
    activitiesSheet.columns = [
        { header: 'Fecha', key: 'date', width: 20 },
        { header: 'Autor', key: 'author', width: 22 },
        { header: 'Tipo', key: 'type', width: 16 },
        { header: 'Detalle', key: 'text', width: 60 },
    ];
    activitiesSheet.getRow(1).font = { bold: true };
    for (const a of lead.activities) {
        activitiesSheet.addRow({
            date: a.createdAt.toLocaleString('es-CL'),
            author: a.authorName,
            type: activityTypeLabel(a.type),
            text: a.text,
        });
    }
    activitiesSheet.getColumn('text').alignment = { wrapText: true, vertical: 'top' };

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${lead.code}-gestiones.xlsx`;

    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
