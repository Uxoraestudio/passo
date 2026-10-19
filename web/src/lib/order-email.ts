import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, EmailNotConfigured } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/emails/order-confirmation";
import { loadOrderTickets } from "@/lib/order-tickets";

const siteUrl = () => (process.env.SITE_URL || "https://aforiq.cl").replace(/\/$/, "");

/**
 * Sends the "compra confirmada" e-mail for a paid order, once. Flow's notice
 * and the buyer's return both end up here; the conditional update lets only
 * one of them through. If sending fails the claim is released so the next
 * sync of the same order retries. Never throws: a mail problem must not undo
 * or delay a confirmed payment.
 */
export async function sendOrderConfirmation(orderId: string) {
  const admin = createAdminClient();
  try {
    const { data: claimed } = await admin
      .from("orders")
      .update({ confirmation_email_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "paid")
      .eq("kind", "sale")
      .is("confirmation_email_at", null)
      .select("id, code, buyer_email, buyer_name, buyer_first_name, subtotal, service_fee, total, event_id")
      .maybeSingle();
    if (!claimed) return;

    try {
      const [{ data: event }, tickets] = await Promise.all([
        admin.from("events").select("title, event_date, venue, city").eq("id", claimed.event_id).single(),
        loadOrderTickets(orderId, admin),
      ]);
      const base = siteUrl();
      const mail = orderConfirmationEmail({
        buyerName: claimed.buyer_first_name || claimed.buyer_name,
        orderCode: claimed.code,
        orderUrl: `${base}/compra/${orderId}/`,
        printUrl: `${base}/compra/${orderId}/imprimir/`,
        event: { title: event?.title ?? "tu evento", date: event?.event_date ?? new Date().toISOString(), venue: event?.venue ?? "", city: event?.city ?? "" },
        tickets: tickets
          .filter((t) => t.status !== "void")
          .map((t) => ({
            // Same numbering as the printed tickets: position among all the order's tickets.
            shortCode: `${claimed.code}-${String(tickets.indexOf(t) + 1).padStart(2, "0")}`,
            holder: t.holderName,
            sector: t.sectorName,
            seat: t.seatText,
          })),
        subtotal: claimed.subtotal,
        serviceFee: claimed.service_fee,
        total: claimed.total,
      });
      await sendEmail({ to: claimed.buyer_email, ...mail });
    } catch (cause) {
      await admin.from("orders").update({ confirmation_email_at: null }).eq("id", orderId);
      throw cause;
    }
  } catch (cause) {
    if (cause instanceof EmailNotConfigured) console.warn("Order e-mail skipped:", cause.message);
    else console.error("Order confirmation e-mail failed", orderId, cause);
  }
}
