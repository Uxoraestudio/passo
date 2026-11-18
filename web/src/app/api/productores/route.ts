import type { NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { EVENT_CATEGORIES, EXPECTED_ATTENDEES, PRODUCER_MESSAGE_MAX, TENTATIVE_DATES, includes, producerCountry } from "@/lib/producers";

const NOTIFY_EMAIL = process.env.PRODUCER_REQUESTS_EMAIL || "organizadores@aforiq.cl";
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
  // Honeypot: bots fill every field; pretend it worked.
  if (field(body.website, 200)) return json(200, { ok: true });

  const data = {
    first_name: field(body.firstName, 80),
    last_name: field(body.lastName, 80),
    company: field(body.company, 120),
    email: field(body.email, 160).toLowerCase(),
    phone: field(body.phone, 30),
    country: producerCountry(body.country)?.code ?? null,
    city: field(body.city, 80) || null,
    event_name: field(body.eventName, 160) || null,
    category: includes(EVENT_CATEGORIES, body.category) ? body.category : null,
    tentative_date: includes(TENTATIVE_DATES, body.tentativeDate) ? body.tentativeDate : null,
    expected_attendees: includes(EXPECTED_ATTENDEES, body.expectedAttendees) ? body.expectedAttendees : null,
    event_url: field(body.eventUrl, 300) || null,
    message: field(body.message, PRODUCER_MESSAGE_MAX) || null,
  };

  if (!data.country || !data.first_name || !data.last_name || !data.company || !EMAIL.test(data.email) || data.phone.replace(/\D/g, "").length < 8 || body.consent !== true) {
    return json(400, { error: "Revisa el formulario: hay datos obligatorios incompletos o no válidos." });
  }

  const { data: claims } = await (await createClient()).auth.getClaims();
  const userId = (claims?.claims?.sub as string | undefined) ?? null;

  // Stored for the admin's review list; the table may not exist until its migration is applied.
  let stored = false;
  try {
    const { error } = await createAdminClient().from("producer_requests").insert({ ...data, user_id: userId });
    if (error) throw error;
    stored = true;
  } catch (cause) {
    console.error("producer_requests insert failed", cause);
  }

  const rows: [string, string][] = [
    ["Nombre", `${data.first_name} ${data.last_name}`],
    ["Productora / empresa", data.company],
    ["Correo", data.email],
    ["Teléfono", data.phone],
    ["País", producerCountry(data.country)?.name ?? data.country],
    ["Ciudad", data.city ?? "—"],
    ["Evento", data.event_name ?? "—"],
    ["Categoría", data.category ?? "—"],
    ["Fecha tentativa", data.tentative_date ?? "—"],
    ["Asistentes esperados", data.expected_attendees ?? "—"],
    ["Enlace", data.event_url ?? "—"],
    ["¿Tiene cuenta Aforiq?", userId ? "Sí, envió el formulario con sesión iniciada" : "No inició sesión al enviar"],
  ];
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nMensaje:\n${data.message ?? "—"}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111827">
<h2 style="margin:0 0 12px">Nueva solicitud de productor</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#6b7280">${k}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`)
    .join("")}</table>
<p style="margin:16px 0 4px;color:#6b7280">Mensaje</p>
<p style="white-space:pre-wrap;margin:0">${escapeHtml(data.message ?? "—")}</p>
<p style="margin-top:20px;color:#9ca3af;font-size:12px">Revísala en el admin, en Solicitudes: al aprobarla se crea la productora y se le envía la invitación al panel. Responde a este correo para contactarle.</p>
</div>`;

  let emailed = false;
  try {
    await sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: data.email,
      subject: `Nueva solicitud de productor · ${data.company}`,
      html,
      text,
    });
    emailed = true;
  } catch (cause) {
    console.error("producer request e-mail failed", cause);
  }

  if (!stored && !emailed) {
    return json(502, { error: "No pudimos enviar tu solicitud en este momento. Inténtalo de nuevo en unos minutos." });
  }
  return json(200, { ok: true });
}
