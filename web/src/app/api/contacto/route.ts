import type { NextRequest } from "next/server";
import { sendEmail, EmailNotConfigured } from "@/lib/email";
import { MESSAGE_MAX, MESSAGE_MIN, isReason, reasonLabel } from "@/lib/contact";

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "contacto@aforiq.cl";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const field = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return json(403, { error: "Origen no permitido." });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json(400, { error: "La solicitud no es válida." });

  // Honeypot: real people never fill this hidden field; pretend it worked.
  if (field(body.website, 200)) return json(200, { ok: true });

  const reason = body.reason;
  const firstName = field(body.firstName, 80);
  const lastName = field(body.lastName, 80);
  const email = field(body.email, 160);
  const phone = field(body.phone, 30);
  const eventName = field(body.eventName, 160);
  const orderCode = field(body.orderCode, 40).toUpperCase();
  const message = field(body.message, MESSAGE_MAX);

  if (!isReason(reason) || !firstName || !lastName || !EMAIL.test(email) || message.length < MESSAGE_MIN || body.consent !== true) {
    return json(400, { error: "Revisa los campos del formulario: hay datos incompletos o no válidos." });
  }

  const rows: [string, string][] = [
    ["Motivo", reasonLabel(reason)],
    ["Nombre", `${firstName} ${lastName}`],
    ["Correo", email],
    ["Teléfono", phone || "—"],
    ["Evento", eventName || "—"],
    ["Código de orden", orderCode || "—"],
  ];

  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nMensaje:\n${message}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827">
<h2 style="margin:0 0 12px">Nueva consulta desde aforiq.cl</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#6b7280">${k}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`)
    .join("")}</table>
<p style="margin:16px 0 4px;color:#6b7280">Mensaje</p>
<p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>
<p style="margin-top:20px;color:#9ca3af;font-size:12px">Responde a este correo para contestarle directamente a ${escapeHtml(email)}.</p>
</div>`;

  try {
    await sendEmail({
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `Contacto · ${reasonLabel(reason)} · ${firstName} ${lastName}`,
      html,
      text,
    });
  } catch (cause) {
    console.error(cause instanceof EmailNotConfigured ? "Contact form: e-mail not configured" : "Contact form send failed", cause);
    return json(502, { error: "No pudimos enviar tu mensaje en este momento. Inténtalo de nuevo en unos minutos." });
  }

  return json(200, { ok: true });
}
