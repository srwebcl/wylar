import 'server-only';
import { Resend } from 'resend';
import { leadTypeLabel, sourceLabel } from './constants';
import type { Lead } from '@prisma/client';

// Notificaciones por correo del Módulo de Captura de Oportunidades: al
// llegar un lead nuevo se avisa al equipo (contacto@wylar.cl) y se confirma
// la recepción a quien completó el formulario. Nunca debe tumbar la
// creación del lead si falla — ver los try/catch en cada función exportada.

const FROM = 'WYLAR Casa Certificadora <notificaciones@wylar.cl>';
const REPLY_TO = 'contacto@wylar.cl';
const TEAM_EMAIL = 'contacto@wylar.cl';
const LOGO_BLANCO_URL = 'https://www.wylar.cl/images/logo-blanco.webp';
const CRM_APP_URL = process.env.PUBLIC_CRM_ORIGIN || 'https://crm.wylar.cl';

function getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    return new Resend(apiKey);
}

// Envoltorio HTML compartido: encabezado con el logo blanco sobre fondo azul corporativo (#0B1E40),
// cuerpo, pie de página legal — así todos los correos se ven oficiales y con la identidad de Wylar.
function emailShell(bodyHtml: string): string {
    return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#0B1E40;padding:22px 32px;border-bottom:1px solid #0B1E40;">
                <img src="${LOGO_BLANCO_URL}" alt="WYLAR Casa Certificadora" height="40" style="height:40px;width:auto;display:block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1e293b;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.5;">
                Wylar Ltda. · La Casa Certificadora de Chile.<br />
                Río Blanco 1371, Barrio Industrial, Arica · Av. Libertador Bernardo O'Higgins 252 oficina 21, Santiago.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** Aviso interno al equipo: llegó un lead nuevo. */
export async function sendLeadNotificationEmail(lead: Lead) {
    const resend = getResend();
    if (!resend) return;

    const rows: [string, string][] = [
        ['Tipo', leadTypeLabel(lead.type)],
        ['Nombre', lead.name],
        ['Correo', lead.email],
        ['Teléfono', lead.phone],
        ...(lead.company ? ([['Empresa/Institución', lead.company]] as [string, string][]) : []),
        ...(lead.certificationInterest ? ([['Certificación de interés', lead.certificationInterest]] as [string, string][]) : []),
        ['Origen', sourceLabel(lead.source)],
    ];

    const rowsHtml = rows
        .map(
            ([label, value]) =>
                `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:180px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">${escapeHtml(value)}</td></tr>`,
        )
        .join('');

    const messageHtml = lead.message
        ? `<p style="margin:20px 0 0;padding:16px;background-color:#f8fafc;border-radius:10px;color:#334155;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(lead.message)}</p>`
        : '';

    const html = emailShell(`
        <p style="margin:0 0 4px;color:#2563eb;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Nuevo prospecto · ${escapeHtml(lead.code)}</p>
        <h1 style="margin:0 0 20px;font-size:20px;color:#0B1E40;">${escapeHtml(lead.name)} completó el formulario del sitio</h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
        ${messageHtml}
        <a href="${CRM_APP_URL}/leads/${lead.id}" style="display:inline-block;margin-top:24px;padding:12px 24px;background-color:#0B1E40;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:999px;">Ver en el CRM</a>
    `);

    try {
        const { error } = await resend.emails.send({
            from: FROM,
            to: TEAM_EMAIL,
            replyTo: lead.email,
            subject: `Nuevo prospecto: ${lead.name} (${lead.code})`,
            html,
        });
        // El SDK de Resend no lanza excepción por errores de la API (key
        // inválida, dominio no verificado, etc.) — devuelve { error } sin más.
        // Sin este chequeo, un envío que en realidad falló queda invisible.
        if (error) console.error('[email] Resend rechazó el aviso de lead nuevo:', error);
    } catch (error) {
        console.error('[email] no se pudo enviar el aviso de lead nuevo:', error);
    }
}

/** Confirmación al cliente: "recibimos tu solicitud". */
export async function sendLeadConfirmationEmail(lead: Lead) {
    const resend = getResend();
    if (!resend) return;

    const html = emailShell(`
        <h1 style="margin:0 0 16px;font-size:20px;color:#0B1E40;">¡Recibimos tu solicitud, ${escapeHtml(lead.name.split(' ')[0])}!</h1>
        <p style="margin:0 0 16px;">Gracias por escribirnos a Wylar${lead.certificationInterest ? ` sobre <strong>${escapeHtml(lead.certificationInterest)}</strong>` : ''}. Nuestro equipo revisó tu solicitud y se pondrá en contacto contigo en menos de 24 horas hábiles.</p>
        <p style="margin:0 0 16px;">Tu número de solicitud es <strong>${escapeHtml(lead.code)}</strong> — puedes mencionarlo si necesitas escribirnos de nuevo.</p>
        <p style="margin:24px 0 0;color:#64748b;font-size:13px;">Si tienes dudas mientras tanto, responde directamente este correo o escríbenos a <a href="mailto:contacto@wylar.cl" style="color:#2563eb;">contacto@wylar.cl</a>.</p>
    `);

    try {
        const { error } = await resend.emails.send({
            from: FROM,
            to: lead.email,
            replyTo: REPLY_TO,
            subject: 'Recibimos tu solicitud — WYLAR Casa Certificadora',
            html,
        });
        if (error) console.error('[email] Resend rechazó la confirmación al cliente:', error);
    } catch (error) {
        console.error('[email] no se pudo enviar la confirmación al cliente:', error);
    }
}

/** Envío de cotización con PDF adjunto al correo del cliente */
export async function sendQuotePdfEmail(params: {
    recipientEmail: string;
    quoteCode: string;
    clientName: string;
    totalAmount: number;
    itemsSummary: Array<{ description: string; quantity: number; subtotal: number }>;
    customMessage?: string | null;
    pdfBuffer: Buffer | Uint8Array;
}): Promise<{ ok: boolean; error?: string }> {
    const resend = getResend();
    if (!resend) {
        return { ok: false, error: 'Servicio de correo no configurado (falta RESEND_API_KEY).' };
    }

    const itemsRows = params.itemsSummary
        .map(
            (it) =>
                `<tr>
                    <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">${escapeHtml(it.description)}</td>
                    <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:center;color:#64748b;">${it.quantity}</td>
                    <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;font-weight:600;color:#0B1E40;">$${Math.round(it.subtotal).toLocaleString('es-CL')}</td>
                </tr>`,
        )
        .join('');

    const customMsgHtml = params.customMessage
        ? `<div style="margin:20px 0;padding:14px;background-color:#f8fafc;border-left:4px solid #0B1E40;border-radius:4px;color:#334155;font-size:14px;line-height:1.5;">${escapeHtml(params.customMessage)}</div>`
        : '';

    const html = emailShell(`
        <h1 style="margin:0 0 16px;font-size:20px;color:#0B1E40;">Cotización N° ${escapeHtml(params.quoteCode)}</h1>
        <p style="margin:0 0 14px;font-size:15px;color:#334155;">Estimado(a) <strong>${escapeHtml(params.clientName)}</strong>,</p>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
            Junto con saludar cordialmente, le hacemos llegar adjunta la propuesta económica correspondiente a los servicios solicitados en WYLAR Casa Certificadora.
        </p>

        ${customMsgHtml}

        <div style="margin:20px 0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
                <thead>
                    <tr style="background-color:#0B1E40;color:#ffffff;">
                        <th style="padding:8px 10px;text-align:left;font-size:12px;text-transform:uppercase;">Descripción</th>
                        <th style="padding:8px 10px;text-align:center;font-size:12px;text-transform:uppercase;">Cant.</th>
                        <th style="padding:8px 10px;text-align:right;font-size:12px;text-transform:uppercase;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                    <tr style="background-color:#f8fafc;">
                        <td colspan="2" style="padding:10px;font-weight:700;color:#0B1E40;text-align:right;">TOTAL PROPUESTA:</td>
                        <td style="padding:10px;font-weight:800;color:#1C64B4;text-align:right;font-size:15px;">$${Math.round(params.totalAmount).toLocaleString('es-CL')} CLP</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.6;">
            En el archivo PDF adjunto a este correo encontrará el desglose completo, vigencia de la oferta y las condiciones comerciales.
        </p>
        <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
            Para coordinar o resolver cualquier consulta, puede contactarnos al correo <a href="mailto:contacto@wylar.cl" style="color:#2563eb;font-weight:600;text-decoration:none;">contacto@wylar.cl</a> o al teléfono directamente a este correo o comunicarse con nosotros al <a href="tel:+56929566326" style="color:#2563eb;font-weight:600;text-decoration:none;">+56 9 2956 6326</a>.
        </p>
    `);

    try {
        const { error } = await resend.emails.send({
            from: FROM,
            to: params.recipientEmail,
            replyTo: REPLY_TO,
            subject: `Cotización ${params.quoteCode} - WYLAR Casa Certificadora`,
            html,
            attachments: [
                {
                    filename: `Cotizacion-${params.quoteCode}.pdf`,
                    content: Buffer.from(params.pdfBuffer),
                },
            ],
        });

        if (error) {
            console.error('[email] Error enviando cotización vía Resend:', error);
            return { ok: false, error: error.message };
        }
        return { ok: true };
    } catch (err) {
        console.error('[email] Excepción enviando cotización:', err);
        return { ok: false, error: err instanceof Error ? err.message : 'Error inesperado al enviar el correo.' };
    }
}

