import { createClient } from "@/lib/supabase/client";

export type QuotaMode = "general" | "sector";

/**
 * A presale (Preventa 1, Preventa 2…): its own prices per sector, dates and an
 * optional quota, either for the whole presale or per sector.
 */
export type SalePhase = {
  id: string | null;
  name: string;
  starts_at: string;
  ends_at: string;
  quota_mode: QuotaMode;
  /** Whole-presale quota (general mode). */
  quota: number | null;
  /** Presale price per sector id, with its own quota in sector mode; sectors left out keep their normal price. */
  prices: Record<string, { price: number; quota: number | null }>;
};

type PhaseRow = Omit<SalePhase, "prices"> & { id: string; event_phase_prices: { sector_id: string; price: number; quota: number | null }[] };

export async function listSalePhases(eventId: string): Promise<SalePhase[]> {
  const { data, error } = await createClient()
    .from("event_sale_phases")
    .select("id, name, starts_at, ends_at, quota, quota_mode, event_phase_prices(sector_id, price, quota)")
    .eq("event_id", eventId)
    .order("starts_at");
  if (error) throw new Error("No pudimos cargar las preventas de este evento.");
  return ((data ?? []) as PhaseRow[]).map(({ event_phase_prices, ...p }) => ({
    ...p,
    quota_mode: p.quota_mode ?? "general",
    prices: Object.fromEntries(event_phase_prices.map((pp) => [pp.sector_id, { price: Number(pp.price), quota: pp.quota }])),
  }));
}

/** Presale tickets taken per phase (sold or being paid), in total and per sector. */
export type PhaseUsage = Record<string, { sold: number; taken: number; sectors: Record<string, number> }>;

export async function salePhaseUsage(eventId: string): Promise<PhaseUsage> {
  const { data, error } = await createClient().rpc("sale_phase_usage", { p_event_id: eventId });
  if (error || !data) return {};
  return data as PhaseUsage;
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
