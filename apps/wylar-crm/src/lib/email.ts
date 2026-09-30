import 'server-only';
import { Resend } from 'resend';
import { leadTypeLabel, sourceLabel } from './constants';
import type { Lead } from '@prisma/client';

// Notificaciones por correo del Módulo de Captura de Oportunidades: al
// llegar un lead nuevo se avisa al equipo (contacto@wylar.cl) y se confirma
// la recepción a quien completó el formulario. Nunca debe tumbar la
// creación del lead si falla — ver los try/catch en cada función exportada.

const FROM = 'Wylar <notificaciones@wylar.cl>';
const REPLY_TO = 'contacto@wylar.cl';
const TEAM_EMAIL = 'contacto@wylar.cl';
const LOGO_URL = 'https://www.wylar.cl/images/logo.webp';
const CRM_APP_URL = process.env.PUBLIC_CRM_ORIGIN || 'https://crm.wylar.cl';

function getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    return new Resend(apiKey);
}

// Envoltorio HTML compartido: encabezado con el logo, cuerpo, pie de página
// legal — así ambos correos (equipo y cliente) se ven como el mismo remitente
// y no como un aviso automático genérico sin marca.
function emailShell(bodyHtml: string): string {
    return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#050B14;padding:24px 32px;">
                <img src="${LOGO_URL}" alt="Wylar" height="32" style="height:32px;width:auto;display:block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1e293b;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.5;">
                Wylar Ltda. · Centro de Evaluación y Certificación de Competencias Laborales acreditado por ChileValora.<br />
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
            subject: 'Recibimos tu solicitud — Wylar',
            html,
        });
        if (error) console.error('[email] Resend rechazó la confirmación al cliente:', error);
    } catch (error) {
        console.error('[email] no se pudo enviar la confirmación al cliente:', error);
    }
}
