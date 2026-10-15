import type { SupabaseClient } from "@supabase/supabase-js";
import { parseSeatLabel } from "@/lib/seatMap";

export type SeatParts = { row: string | null; number: number | null };

/**
 * Row and number of sold seats. Plan seats carry their own (their labels may
 * have a prefix without a hyphen, like "PIA4"); grid seats are read from the
 * label. Keyed by "sectorId:label".
 */
export async function loadSeatParts(supabase: SupabaseClient, seats: { sectorId: string; label: string }[]): Promise<Map<string, SeatParts>> {
  const parts = new Map<string, SeatParts>();
  if (seats.length === 0) return parts;
  const { data } = await supabase
    .from("event_seats")
    .select("sector_id, label, row_label, number")
    .in("sector_id", [...new Set(seats.map((s) => s.sectorId))])
    .in("label", [...new Set(seats.map((s) => s.label))]);
  for (const s of (data ?? []) as { sector_id: string; label: string; row_label: string | null; number: number | null }[]) {
    parts.set(`${s.sector_id}:${s.label}`, { row: s.row_label, number: s.number });
  }
  for (const s of seats) {
    const key = `${s.sectorId}:${s.label}`;
    if (!parts.has(key)) {
      const parsed = parseSeatLabel(s.label);
      parts.set(key, { row: parsed?.row ?? null, number: parsed?.number ?? null });
    }
  }
  return parts;
}
