import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SELECTION_HOLD_MINUTES, orderErrorFor } from "@/lib/payments";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Same rule as venue_seats.label: grid seats ("A12") and plan seats ("PB-A12", "1-12").
const SEAT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,23}$/;

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
    p_hold_minutes: SELECTION_HOLD_MINUTES,
  });
  if (error || !order) {
    const failure = orderErrorFor(error?.message);
    if (failure.code === "UNKNOWN") console.error("create_order failed", error);
    return json(failure.status, { error: failure.message, code: failure.code });
  }

  // Payment starts later (/api/checkout/pagar) once the buyer has named every ticket.
  return json(200, { orderId: order.id });
}
