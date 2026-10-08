import { createAdminClient } from "@/lib/supabase/admin";
import { FLOW_STATUS, getFlowPaymentStatus } from "@/lib/flow";

export type OrderStatus = "pending" | "paid" | "rejected" | "cancelled" | "expired" | "refund_required";

// The selection is held while the buyer fills in their details; starting the
// payment extends the hold once to HOLD_MINUTES. The hold outlives the Flow
// order so a payment Flow accepts is always backed by seats.
export const SELECTION_HOLD_MINUTES = 15;
export const HOLD_MINUTES = 17;
export const PAYMENT_WINDOW_SECONDS = 15 * 60;

const orderErrors: Record<string, { status: number; message: string }> = {
  AUTH_REQUIRED: { status: 401, message: "Inicia sesión para comprar entradas." },
  EMPTY_ORDER: { status: 400, message: "Tu selección está vacía." },
  EVENT_NOT_FOUND: { status: 404, message: "Este evento ya no está disponible." },
  EVENT_NOT_ON_SALE: { status: 409, message: "Las entradas para este evento no están a la venta." },
  EVENT_PAST: { status: 409, message: "Este evento ya se realizó." },
  SALE_NOT_STARTED: { status: 409, message: "La venta para este evento aún no comienza." },
  TOO_MANY_ATTEMPTS: { status: 429, message: "Hiciste demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo." },
  QTY_LIMIT: { status: 400, message: "Superaste el máximo de entradas por compra para este evento." },
  SECTOR_NOT_FOUND: { status: 409, message: "Uno de los sectores ya no está disponible. Actualiza la página." },
  SEATS_MISMATCH: { status: 400, message: "Selecciona un asiento por cada entrada." },
  SEAT_INVALID: { status: 400, message: "Uno de los asientos no existe en este sector." },
  SEAT_TAKEN: { status: 409, message: "Alguien acaba de tomar uno de tus asientos. Elige otro." },
  SOLD_OUT: { status: 409, message: "No quedan suficientes entradas en ese sector." },
  ORDER_NOT_FOUND: { status: 404, message: "No encontramos tu reserva." },
  ORDER_EXPIRED: { status: 409, message: "Se acabó el tiempo de tu reserva. Vuelve a elegir tus entradas." },
  PAYMENT_ALREADY_STARTED: { status: 409, message: "Ya iniciaste el pago de esta compra. Revisa su estado antes de volver a pagar." },
  DETAILS_MISSING: { status: 400, message: "Completa los datos del comprador y de cada asistente antes de pagar." },
  DETAILS_INVALID: { status: 400, message: "Revisa los datos ingresados: hay campos incompletos o no válidos." },
  DUPLICATE_DOCUMENT: { status: 400, message: "Cada entrada debe quedar a nombre de una persona distinta (RUT o pasaporte repetido)." },
};

export function orderErrorFor(message: string | undefined) {
  const code = Object.keys(orderErrors).find((key) => message?.includes(key));
  return code
    ? { code, ...orderErrors[code] }
    : { code: "UNKNOWN", status: 500, message: "No pudimos reservar tus entradas. Inténtalo de nuevo." };
}

/**
 * Asks Flow for the real state of a payment and applies it to the order.
 * Safe to call any number of times (confirmation callback, return page,
 * result page): the database functions are idempotent.
 */
export async function syncFlowPayment(token: string, source: "confirmation" | "return" | "reconcile") {
  const admin = createAdminClient();
  const payment = await getFlowPaymentStatus(token);

  const { data: order } = await admin
    .from("orders")
    .select("id, code, total, status, flow_token")
    .eq("code", payment.commerceOrder)
    .maybeSingle();

  await admin.from("payment_events").insert({
    order_id: order?.id ?? null,
    source,
    flow_token: token,
    flow_status: payment.status,
    amount: payment.amount,
    payload: payment,
  });

  if (!order || (order.flow_token && order.flow_token !== token)) {
    return null;
  }

  let status = order.status as OrderStatus;

  if (payment.status === FLOW_STATUS.paid) {
    const { data, error } = await admin.rpc("confirm_order_payment", {
      p_order_id: order.id,
      p_flow_order: payment.flowOrder,
      p_amount: Math.round(Number(payment.amount)),
    });
    if (error) throw error;
    status = data as OrderStatus;
  } else if (payment.status === FLOW_STATUS.rejected || payment.status === FLOW_STATUS.cancelled) {
    const { data, error } = await admin.rpc("fail_order_payment", {
      p_order_id: order.id,
      p_status: payment.status === FLOW_STATUS.rejected ? "rejected" : "cancelled",
    });
    if (error) throw error;
    status = data as OrderStatus;
  }

  return { orderId: order.id as string, status };
}
