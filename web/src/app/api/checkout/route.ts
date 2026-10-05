import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createFlowPayment } from "@/lib/flow";
import { HOLD_MINUTES, PAYMENT_WINDOW_SECONDS, orderErrorFor } from "@/lib/payments";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEAT = /^[A-Z]{1,2}[0-9]{1,3}$/;

type CheckoutItem = { sector_id: string; quantity: number; seats: string[] };

function parseBody(body: unknown): { eventId: string; items: CheckoutItem[] } | null {
  if (!body || typeof body !== "object") return null;
  const { eventId, items } = body as { eventId?: unknown; items?: unknown };
  if (typeof eventId !== "string" || !UUID.test(eventId) || !Array.isArray(items) || items.length === 0 || items.length > 10) {
    return null;
  }
  const parsed: CheckoutItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") return null;
    const { sectorId, quantity, seats } = raw as { sectorId?: unknown; quantity?: unknown; seats?: unknown };
    if (typeof sectorId !== "string" || !UUID.test(sectorId)) return null;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null;
    const seatList = seats === undefined ? [] : seats;
    if (!Array.isArray(seatList) || !seatList.every((s) => typeof s === "string" && SEAT.test(s))) return null;
    parsed.push({ sector_id: sectorId, quantity, seats: seatList as string[] });
  }
  return { eventId, items: parsed };
}

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  // Same-origin only: a third-party page must not be able to start a checkout for a signed-in buyer.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return json(403, { error: "Origen no permitido." });
  }

  const input = parseBody(await request.json().catch(() => null));
  if (!input) {
    return json(400, { error: "La solicitud no es válida." });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json(401, { error: "Inicia sesión para comprar entradas." });
  }

  const { data: order, error } = await supabase.rpc("create_order", {
    p_event_id: input.eventId,
    p_items: input.items,
    p_hold_minutes: HOLD_MINUTES,
  });
  if (error || !order) {
    const failure = orderErrorFor(error?.message);
    if (failure.code === "UNKNOWN") console.error("create_order failed", error);
    return json(failure.status, { error: failure.message, code: failure.code });
  }

  const admin = createAdminClient();
  const { data: event } = await admin.from("events").select("title").eq("id", input.eventId).single();
  const siteUrl = process.env.SITE_URL || request.nextUrl.origin;

  try {
    const payment = await createFlowPayment({
      commerceOrder: order.code,
      subject: `Entradas ${event?.title ?? "Passo"} · ${order.code}`,
      amount: order.total,
      email: order.buyer_email,
      urlConfirmation: `${siteUrl}/api/flow/confirmacion/`,
      urlReturn: `${siteUrl}/api/flow/retorno/`,
      timeoutSeconds: PAYMENT_WINDOW_SECONDS,
    });

    const { error: attachError } = await admin.rpc("attach_flow_payment", {
      p_order_id: order.id,
      p_token: payment.token,
      p_flow_order: payment.flowOrder,
    });
    if (attachError) throw attachError;

    return json(200, { orderId: order.id, redirectUrl: payment.redirectUrl });
  } catch (cause) {
    console.error("Flow payment/create failed", cause);
    await admin.rpc("fail_order_payment", { p_order_id: order.id, p_status: "cancelled" });
    return json(502, { error: "No pudimos conectar con el medio de pago. Tus entradas no fueron cobradas; inténtalo de nuevo." });
  }
}
