import "server-only";

/**
 * E-mail through Resend's HTTP API (no SDK needed). The sender must belong to
 * a domain verified in Resend (aforiq.cl).
 */
const FROM = process.env.EMAIL_FROM || "Aforiq <no-reply@aforiq.cl>";

export type Email = { to: string; subject: string; html: string; text: string };

export class EmailNotConfigured extends Error {}

export async function sendEmail({ to, subject, html, text }: Email): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new EmailNotConfigured("RESEND_API_KEY no está configurada.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Resend respondió ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  return (await response.json()) as { id: string };
}
