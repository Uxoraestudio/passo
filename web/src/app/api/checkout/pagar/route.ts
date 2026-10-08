import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createFlowPayment } from "@/lib/flow";
import { HOLD_MINUTES, PAYMENT_WINDOW_SECONDS, orderErrorFor } from "@/lib/payments";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return json(403, { error: "Origen no permitido." });
  }

  const body = (await request.json().catch(() => null)) as { orderId?: unknown } | null;
  const orderId = body?.orderId;
  if (typeof orderId !== "string" || !UUID.test(orderId)) {
    return json(400, { error: "La solicitud no es válida." });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json(401, { error: "Inicia sesión para comprar entradas." });
  }

  // RLS only returns the buyer's own orders, so this doubles as the ownership check.
  const { data: owned } = await supabase.from("orders").select("id").eq("id", orderId).maybeSingle();
  if (!owned) {
    return json(404, { error: "No encontramos tu reserva." });
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin.rpc("begin_order_payment", { p_order_id: orderId, p_minutes: HOLD_MINUTES });
  if (error || !order) {
    const failure = orderErrorFor(error?.message);
    if (failure.code === "UNKNOWN") console.error("begin_order_payment failed", error);
    return json(failure.status, { error: failure.message, code: failure.code });
  }

  const { data: event } = await admin.from("events").select("title").eq("id", order.event_id).single();
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

    return json(200, { redirectUrl: payment.redirectUrl });
  } catch (cause) {
    // The order stays reserved (no Flow token attached), so the buyer can retry.
    console.error("Flow payment/create failed", cause);
    return json(502, { error: "No pudimos conectar con el medio de pago. No se hizo ningún cobro; inténtalo de nuevo." });
  }
}
