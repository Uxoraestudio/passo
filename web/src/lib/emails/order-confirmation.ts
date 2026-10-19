/**
 * "Compra confirmada" e-mail. Plain table layout with inline styles, which is
 * what mail clients (Gmail, Outlook, Apple Mail) render reliably; no images,
 * so it reads the same with images blocked.
 */

export type OrderEmailData = {
  buyerName: string | null;
  orderCode: string;
  orderUrl: string;
  printUrl: string;
  event: { title: string; date: string; venue: string; city: string };
  tickets: { shortCode: string; holder: string | null; sector: string; seat: string }[];
  subtotal: number;
  /** Coupon discount on the subtotal, if any. */
  discount?: number;
  couponCode?: string | null;
  serviceFee: number;
  total: number;
};

const INK = "#211333";
const ORANGE = "#FF782D";
const MUTED = "#6b6680";
const LINE = "#ece9f3";

const money = (v: number) => `$${v.toLocaleString("es-CL")}`;

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** "viernes 11 de diciembre de 2026, 21:00 hrs", in Chilean time. */
export function eventDateText(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Santiago" }).format(d);
  const time = new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Santiago" }).format(d);
  return `${day}, ${time} hrs`;
}

export function orderConfirmationEmail(data: OrderEmailData) {
  const count = data.tickets.length;
  const what = count === 1 ? "tu entrada" : `tus ${count} entradas`;
  const hello = data.buyerName?.trim() ? `Hola ${data.buyerName.trim().split(/\s+/)[0]},` : "Hola,";
  const subject = `Tus entradas para ${data.event.title} · ${data.orderCode}`;
  const when = eventDateText(data.event.date);
  const where = [data.event.venue, data.event.city].filter(Boolean).join(", ");

  const rows = data.tickets
    .map(
      (t) => `
        <tr>
          <td style="padding:12px 0;border-top:1px solid ${LINE};font-size:14px;color:${INK};">
            <strong>${escape(t.holder ?? "Entrada al portador")}</strong><br>
            <span style="color:${MUTED};">${escape(t.sector)} · ${escape(t.seat)}</span>
          </td>
          <td align="right" style="padding:12px 0;border-top:1px solid ${LINE};font-size:13px;color:${MUTED};font-family:Menlo,Consolas,monospace;white-space:nowrap;">
            ${escape(t.shortCode)}
          </td>
        </tr>`
    )
    .join("");

  const button = (href: string, label: string, solid: boolean) => `
    <a href="${escape(href)}" style="display:inline-block;padding:13px 22px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;${
      solid ? `background:${ORANGE};color:#ffffff;` : `background:#ffffff;color:${INK};border:1px solid ${LINE};`
    }">${label}</a>`;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Compra confirmada: ${escape(what)} para ${escape(data.event.title)}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f9;">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding:0 4px 16px;font-size:24px;font-weight:800;letter-spacing:-0.5px;color:${INK};">
          <span style="color:${ORANGE};">[ ]</span> aforiq
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;padding:28px 26px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#047857;">Compra confirmada</p>
          <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:${INK};">${escape(data.event.title)}</h1>
          <p style="margin:0 0 4px;font-size:15px;color:${INK};">${escape(when)}</p>
          <p style="margin:0 0 22px;font-size:15px;color:${MUTED};">${escape(where)}</p>

          <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${INK};">
            ${escape(hello)} recibimos tu pago y ${escape(what)} ya ${count === 1 ? "está lista" : "están listas"}.
            Muestra el código QR de cada entrada en la puerta, desde tu teléfono o impresa.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
            <tr><td colspan="2" style="padding:0 0 6px;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${MUTED};">
              ${count === 1 ? "Entrada" : `Entradas (${count})`}
            </td></tr>
            ${rows}
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
              <td style="padding:0 10px 10px 0;">${button(data.orderUrl, "Ver mis entradas", true)}</td>
              <td style="padding:0 0 10px;">${button(data.printUrl, "Imprimir", false)}</td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};">
            <tr><td style="padding:12px 0 2px;font-size:14px;color:${MUTED};">Entradas</td><td align="right" style="padding:12px 0 2px;font-size:14px;color:${INK};">${money(data.subtotal)}</td></tr>
            ${
              data.discount
                ? `<tr><td style="padding:2px 0;font-size:14px;color:${MUTED};">Cupón ${escape(data.couponCode ?? "")}</td><td align="right" style="padding:2px 0;font-size:14px;color:#047857;">−${money(data.discount)}</td></tr>`
                : ""
            }
            <tr><td style="padding:2px 0;font-size:14px;color:${MUTED};">Cargo por servicio</td><td align="right" style="padding:2px 0;font-size:14px;color:${INK};">${money(data.serviceFee)}</td></tr>
            <tr><td style="padding:8px 0 0;font-size:16px;font-weight:800;color:${INK};">Total pagado</td><td align="right" style="padding:8px 0 0;font-size:16px;font-weight:800;color:${INK};">${money(data.total)}</td></tr>
          </table>
          <p style="margin:14px 0 0;font-size:13px;color:${MUTED};">Orden ${escape(data.orderCode)}</p>
        </td></tr>
        <tr><td style="padding:18px 8px 0;font-size:12px;line-height:1.5;color:${MUTED};text-align:center;">
          Para ver tus entradas inicia sesión en aforiq.cl con este correo.<br>
          Este es un correo automático, por favor no lo respondas.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Compra confirmada · ${data.event.title}`,
    `${when}`,
    where,
    "",
    `${hello} recibimos tu pago y ${what} ya ${count === 1 ? "está lista" : "están listas"}.`,
    "",
    ...data.tickets.map((t) => `- ${t.holder ?? "Entrada al portador"} · ${t.sector} · ${t.seat} (${t.shortCode})`),
    "",
    `Entradas: ${money(data.subtotal)}`,
    ...(data.discount ? [`Cupón ${data.couponCode ?? ""}: −${money(data.discount)}`] : []),
    `Cargo por servicio: ${money(data.serviceFee)}`,
    `Total pagado: ${money(data.total)}`,
    "",
    `Ver mis entradas: ${data.orderUrl}`,
    `Imprimir: ${data.printUrl}`,
    "",
    `Orden ${data.orderCode}. Este es un correo automático, por favor no lo respondas.`,
  ].join("\n");

  return { subject, html, text };
}
