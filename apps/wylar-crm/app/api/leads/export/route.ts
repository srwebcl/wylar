import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { buildLeadsWhere } from '@/lib/leadsFilter';
import { leadTypeLabel, sourceLabel, statusLabel } from '@/lib/constants';

/** Exporta a Excel el listado de prospectos con los filtros activos
 * (los mismos query params que /leads: q, status, source, assignedToId)
 * — sin paginar, trae todos los que calcen. */
export async function GET(request: Request) {
    await requireUser();

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const where = buildLeadsWhere(params);

    const leads = await prisma.lead.findMany({
        where,
        include: { assignedTo: { select: { name: true } }, client: { select: { id: true } }, product: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Oportunidades');
    sheet.columns = [
        { header: 'Código', key: 'code', width: 14 },
        { header: 'Tipo', key: 'type', width: 18 },
        { header: 'Nombre', key: 'name', width: 28 },
        { header: 'RUT', key: 'rut', width: 16 },
        { header: 'Empresa', key: 'company', width: 24 },
        { header: 'Correo', key: 'email', width: 28 },
        { header: 'Teléfono', key: 'phone', width: 16 },
        { header: 'Producto', key: 'product', width: 30 },
        { header: 'Categoría', key: 'category', width: 24 },
        { header: 'Comuna', key: 'comuna', width: 18 },
        { header: 'Estado', key: 'status', width: 16 },
        { header: 'Motivo desistimiento', key: 'lostReason', width: 30 },
        { header: 'Origen', key: 'source', width: 16 },
        { header: 'Responsable', key: 'assignedTo', width: 20 },
        { header: 'Fecha de ingreso', key: 'createdAt', width: 18 },
        { header: 'Fecha de cierre/desistimiento', key: 'closedAt', width: 22 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const lead of leads) {
        sheet.addRow({
            code: lead.code,
            type: leadTypeLabel(lead.type),
            name: lead.name,
            rut: lead.rut ?? '',
            company: lead.company ?? '',
            email: lead.email,
            phone: lead.phone,
            product: lead.product?.name ?? lead.certificationInterest ?? '',
            category: lead.product?.category.name ?? '',
            comuna: lead.comuna ?? '',
            status: statusLabel(lead.status),
            lostReason: lead.lostReason ?? '',
            source: sourceLabel(lead.source),
            assignedTo: lead.assignedTo?.name ?? 'Sin asignar',
            createdAt: lead.createdAt.toLocaleDateString('es-CL'),
            closedAt: lead.closedAt ? lead.closedAt.toLocaleDateString('es-CL') : '',
        });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `oportunidades-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
