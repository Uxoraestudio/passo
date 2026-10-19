import { cache } from "react";
import { unstable_cache } from "next/cache";
import { CACHE_SECONDS, createPublicClient } from "@/lib/supabase/public";
import type { EventRow } from "@/lib/events";
import { defaultEventDetail, eventDetails, type EventDetail, type TicketTier } from "@/lib/eventDetails";

export type SaleTier = TicketTier & { capacity: number; available: number; seatsPerRow: number };

/** The presale on sale now (or the next one), from get_sale_phase. */
export type SalePhase = {
  current: {
    id: string;
    name: string;
    ends_at: string;
    quota: number | null;
    remaining: number | null;
    quota_mode?: "general" | "sector";
    sectors?: { sector_id: string; quota: number | null; remaining: number | null }[];
  } | null;
  next: { name: string; starts_at: string } | null;
};

export type EventSale = {
  detail: EventDetail;
  phase: SalePhase;
  /** One line about the presale for the buyer ("Preventa 1 hasta el 20 de octubre…"). */
  phaseNotice: string | null;
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

// Prices, availability and the current presale: the same for every visitor,
// so they are cached for a few seconds and shared (see CACHE_SECONDS.sale).
const saleData = unstable_cache(
  async (eventId: string) => {
    const supabase = createPublicClient();
    const [{ data: sectors }, { data: availability }, { data: prices }, { data: phase }] = await Promise.all([
      supabase
        .from("event_sectors")
        .select("id, name, capacity, price, color, numbered, seats_per_row")
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("sort_order"),
      supabase.rpc("get_sector_availability", { p_event_id: eventId }),
      // Seats with price zones: the cheapest and the most expensive free seat.
      supabase.rpc("get_sector_prices", { p_event_id: eventId }),
      supabase.rpc("get_sale_phase", { p_event_id: eventId }),
    ]);
    const taken = new Map<string, number>(
      ((availability ?? []) as { sector_id: string; taken: number }[]).map((a) => [a.sector_id, a.taken])
    );
    const range = new Map<string, { min: number; max: number; normal: number }>(
      ((prices ?? []) as { sector_id: string; min_price: number; max_price: number; normal_min_price: number | null }[]).map((p) => [
        p.sector_id,
        { min: p.min_price, max: p.max_price, normal: p.normal_min_price ?? p.min_price },
      ])
    );
    return {
      sectors: ((sectors ?? []) as SectorRow[]).map((s) => ({ ...s, taken: taken.get(s.id) ?? 0, range: range.get(s.id) })),
      phase: ((phase as SalePhase | null) ?? { current: null, next: null }) as SalePhase,
    };
  },
  ["event-sale"],
  { revalidate: CACHE_SECONDS.sale, tags: ["events"] }
);

const getSaleData = cache((eventId: string) => saleData(eventId));

function tierStatus(available: number, capacity: number): TicketTier["status"] {
  if (available <= 0) return "agotado";
  if (available <= Math.max(1, Math.ceil(capacity * 0.1))) return "pocas";
  return "disponible";
}

// es-CL writes "10:30 a. m." — callers avoid a doubled period at the end.
const longDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Santiago" }).format(new Date(iso));
const sentence = (text: string) => (text.endsWith(".") ? text : `${text}.`);

function closedReasonFor(row: EventRow, hasTiers: boolean, phase: SalePhase, now: number): string | null {
  if (row.status === "finalizado" || new Date(row.event_date).getTime() < now) return "Este evento ya se realizó.";
  if (row.status !== "en-venta" && row.status !== "casi-agotado") return "Las entradas para este evento aún no están a la venta.";
  // A presale on sale opens the checkout even before the general sale.
  if (!phase.current && row.sale_start && new Date(row.sale_start).getTime() > now) {
    const next = phase.next && new Date(phase.next.starts_at).getTime() < new Date(row.sale_start).getTime() ? phase.next : null;
    return next
      ? sentence(`La ${next.name} comienza el ${longDate(next.starts_at)}`)
      : sentence(`La venta comienza el ${longDate(row.sale_start)}`);
  }
  if (!hasTiers) return "Las entradas para este evento aún no están a la venta.";
  return null;
}

export async function getEventSale(row: EventRow, now = Date.now()): Promise<EventSale> {
  const base = eventDetails[row.id] ?? defaultEventDetail(row);
  const { sectors, phase } = await getSaleData(row.id);
  // Presale tickets left per sector, when the presale has a quota per sector.
  const presaleLeft = new Map((phase.current?.sectors ?? []).filter((x) => x.remaining != null).map((x) => [x.sector_id, x.remaining as number]));

  const tiers: SaleTier[] = sectors.map((s) => {
    const numbered = Boolean(s.numbered);
    const available = Math.max(0, s.capacity - s.taken);
    return {
      id: s.id,
      name: s.name,
      description: numbered ? "Asiento numerado" : "Acceso general",
      price: s.range ? s.range.min : Number(s.price),
      priceMax: s.range && s.range.max > s.range.min ? s.range.max : undefined,
      // Presale price: the normal one is shown struck through next to it.
      normalPrice: s.range && s.range.normal > s.range.min ? s.range.normal : undefined,
      badge:
        phase.current && s.range && s.range.normal > s.range.min
          ? presaleLeft.has(s.id) && presaleLeft.get(s.id)! <= 50
            ? `${phase.current.name} · ${presaleLeft.get(s.id) === 1 ? "queda 1" : `quedan ${presaleLeft.get(s.id)}`}`
            : phase.current.name
          : undefined,
      status: tierStatus(available, s.capacity),
      color: s.color,
      numbered,
      capacity: s.capacity,
      available,
      seatsPerRow: s.seats_per_row ?? 20,
    };
  });

  const closedReason = closedReasonFor(row, tiers.length > 0, phase, now);
  const soldOut = tiers.length > 0 && tiers.every((t) => t.available <= 0);

  const current = phase.current;
  const phaseNotice = current
    ? sentence(
        `${current.name}: precios especiales hasta el ${longDate(current.ends_at)}` +
          (current.remaining != null ? ` o hasta agotar ${current.remaining === 1 ? "la última entrada" : `las ${current.remaining.toLocaleString("es-CL")} entradas que quedan`}` : "")
      )
    : null;

  return {
    phase,
    phaseNotice,
    // Events without sectors keep their display-only default tier so the page still shows a price.
    detail: {
      ...(tiers.length > 0 ? { ...base, tiers } : base),
      // During a presale the hero says so instead of "Venta General Abierta".
      ...(current && closedReason === null ? { primaryBadge: `${current.name} abierta` } : {}),
    },
    tiers,
    onSale: closedReason === null && !soldOut,
    closedReason: closedReason ?? (soldOut ? "Las entradas para este evento están agotadas." : null),
    maxPerOrder: row.max_tickets_per_order ?? 6,
  };
}
