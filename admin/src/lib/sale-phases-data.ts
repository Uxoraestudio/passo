import { createClient } from "@/lib/supabase/client";

/** A presale (Preventa 1, Preventa 2…): its own prices per sector, dates and optional quota. */
export type SalePhase = {
  id: string | null;
  name: string;
  starts_at: string;
  ends_at: string;
  quota: number | null;
  /** Presale price per sector id; sectors left out keep their normal price. */
  prices: Record<string, number>;
};

type PhaseRow = Omit<SalePhase, "prices"> & { id: string; event_phase_prices: { sector_id: string; price: number }[] };

export async function listSalePhases(eventId: string): Promise<SalePhase[]> {
  const { data, error } = await createClient()
    .from("event_sale_phases")
    .select("id, name, starts_at, ends_at, quota, event_phase_prices(sector_id, price)")
    .eq("event_id", eventId)
    .order("starts_at");
  if (error) throw new Error("No pudimos cargar las preventas de este evento.");
  return ((data ?? []) as PhaseRow[]).map(({ event_phase_prices, ...p }) => ({
    ...p,
    prices: Object.fromEntries(event_phase_prices.map((pp) => [pp.sector_id, Number(pp.price)])),
  }));
}

/** Tickets sold per phase (paid orders only), for the "vendidas / cupo" counter. */
export async function soldByPhase(eventId: string): Promise<Record<string, number>> {
  const { data, error } = await createClient()
    .from("orders")
    .select("sale_phase_id, order_items(quantity)")
    .eq("event_id", eventId)
    .eq("status", "paid")
    .not("sale_phase_id", "is", null);
  if (error) return {};
  const sold: Record<string, number> = {};
  for (const o of (data ?? []) as { sale_phase_id: string; order_items: { quantity: number }[] }[]) {
    sold[o.sale_phase_id] = (sold[o.sale_phase_id] ?? 0) + o.order_items.reduce((s, i) => s + i.quantity, 0);
  }
  return sold;
}

const saveErrors: Record<string, string> = {
  FORBIDDEN: "Tu rol no permite editar eventos.",
  PHASES_OVERLAP: "Las fechas de dos preventas se cruzan. Cada preventa debe empezar cuando termina la anterior o después.",
  PHASE_DATES: "Cada preventa debe terminar después de empezar.",
  PHASE_NAME: "Cada preventa necesita un nombre (máximo 40 caracteres).",
  PHASE_QUOTA: "El cupo debe ser 1 o más, o quedar vacío.",
  PHASE_PRICE: "Los precios de preventa deben ser mayores a 0.",
  SECTOR_NOT_FOUND: "Uno de los sectores ya no existe. Recarga la página.",
  PHASES_INVALID: "Puedes configurar hasta 10 preventas por evento.",
};

/** Replaces all the event's presales; returns the saved ones with their ids. */
export async function saveSalePhases(eventId: string, phases: SalePhase[]): Promise<void> {
  const { error } = await createClient().rpc("save_sale_phases", {
    p_event_id: eventId,
    p_phases: phases.map((p) => ({ ...p, id: p.id ?? undefined })),
  });
  if (error) {
    const code = Object.keys(saveErrors).find((k) => error.message.includes(k));
    throw new Error(code ? saveErrors[code] : "No pudimos guardar las preventas. Inténtalo de nuevo.");
  }
}
