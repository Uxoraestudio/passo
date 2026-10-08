import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/events";
import { defaultEventDetail, eventDetails, type EventDetail, type TicketTier } from "@/lib/eventDetails";

export type SaleTier = TicketTier & { capacity: number; available: number; seatsPerRow: number };

export type EventSale = {
  detail: EventDetail;
  tiers: SaleTier[];
  onSale: boolean;
  /** Why tickets can't be bought right now, shown instead of the checkout. */
  closedReason: string | null;
  maxPerOrder: number;
};

type SectorRow = {
  id: string;
  name: string;
  capacity: number;
  price: number;
  color: string;
  numbered: boolean | null;
  seats_per_row: number | null;
};

const getSaleData = cache(async (eventId: string) => {
  const supabase = await createClient();
  const [{ data: sectors }, { data: availability }] = await Promise.all([
    supabase
      .from("event_sectors")
      .select("id, name, capacity, price, color, numbered, seats_per_row")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("sort_order"),
    supabase.rpc("get_sector_availability", { p_event_id: eventId }),
  ]);
  const taken = new Map<string, number>(
    ((availability ?? []) as { sector_id: string; taken: number }[]).map((a) => [a.sector_id, a.taken])
  );
  return ((sectors ?? []) as SectorRow[]).map((s) => ({ ...s, taken: taken.get(s.id) ?? 0 }));
});

function tierStatus(available: number, capacity: number): TicketTier["status"] {
  if (available <= 0) return "agotado";
  if (available <= Math.max(1, Math.ceil(capacity * 0.1))) return "pocas";
  return "disponible";
}

function closedReasonFor(row: EventRow, hasTiers: boolean, now: number): string | null {
  if (row.status === "finalizado" || new Date(row.event_date).getTime() < now) return "Este evento ya se realizó.";
  if (row.status !== "en-venta" && row.status !== "casi-agotado") return "Las entradas para este evento aún no están a la venta.";
  if (row.sale_start && new Date(row.sale_start).getTime() > now) {
    const opens = new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Santiago",
    }).format(new Date(row.sale_start));
    // es-CL writes "10:30 a. m." — avoid a doubled period at the end.
    return `La venta comienza el ${opens}${opens.endsWith(".") ? "" : "."}`;
  }
  if (!hasTiers) return "Las entradas para este evento aún no están a la venta.";
  return null;
}

export async function getEventSale(row: EventRow, now = Date.now()): Promise<EventSale> {
  const base = eventDetails[row.id] ?? defaultEventDetail(row);
  const sectors = await getSaleData(row.id);

  const tiers: SaleTier[] = sectors.map((s) => {
    const numbered = Boolean(s.numbered);
    const available = Math.max(0, s.capacity - s.taken);
    return {
      id: s.id,
      name: s.name,
      description: numbered ? "Asiento numerado" : "Acceso general",
      price: Number(s.price),
      status: tierStatus(available, s.capacity),
      color: s.color,
      numbered,
      capacity: s.capacity,
      available,
      seatsPerRow: s.seats_per_row ?? 20,
    };
  });

  const closedReason = closedReasonFor(row, tiers.length > 0, now);
  const soldOut = tiers.length > 0 && tiers.every((t) => t.available <= 0);

  return {
    // Events without sectors keep their display-only default tier so the page still shows a price.
    detail: tiers.length > 0 ? { ...base, tiers } : base,
    tiers,
    onSale: closedReason === null && !soldOut,
    closedReason: closedReason ?? (soldOut ? "Las entradas para este evento están agotadas." : null),
    maxPerOrder: row.max_tickets_per_order ?? 6,
  };
}
