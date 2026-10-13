import { createClient } from "@/lib/supabase/client";
import { mapFromWire, type MapElement, type Point, type SeatKind, type SeatState, type WireMap } from "@/lib/venue-map-types";

// Seats of an event that uses a venue plan (Fase 5): price zones, blocked seats
// and accessible seats. A seat costs its zone's price, or its sector's price
// when it has no zone.

export type PriceZone = { id: string; name: string; color: string; price: number };

export type EventSeat = {
  id: string;
  sectorId: string;
  rowLabel: string | null;
  label: string;
  number: number | null;
  x: number;
  y: number;
  kind: SeatKind;
  state: SeatState;
  zoneId: string | null;
  blockReason: string | null;
};

export type EventSeatSector = {
  id: string;
  name: string;
  numbered: boolean;
  isActive: boolean;
  capacity: number;
  price: number;
  color: string;
  polygon: Point[];
  labelPoint: Point | null;
  seats: EventSeat[];
};

export type EventSeatMap = {
  eventId: string;
  title: string;
  venueId: string;
  version: number;
  imagePath: string | null;
  imageWidth: number;
  imageHeight: number;
  scaleMPerPx: number | null;
  elements: MapElement[];
  zones: PriceZone[];
  sectors: EventSeatSector[];
};

export type SeatChanges =
  | { status: "BLOCKED"; reason: string }
  | { status: "AVAILABLE" }
  | { price_zone_id: string | null }
  | { kind: SeatKind };

export const BLOCK_REASONS: { value: string; label: string }[] = [
  { value: "produccion", label: "Producción" },
  { value: "prensa", label: "Prensa" },
  { value: "cortesia", label: "Cortesías" },
  { value: "tecnica", label: "Mesa técnica / cámaras" },
  { value: "otro", label: "Otro motivo" },
];

export function blockReasonLabel(value: string | null) {
  if (value === "plano") return "Bloqueado en el plano";
  return BLOCK_REASONS.find((r) => r.value === value)?.label ?? value ?? "Sin motivo";
}

type WireSeat = [string, string | null, string, number | null, number, number, SeatKind, SeatState, string | null, string | null];

type Wire = {
  event_id: string;
  title: string;
  venue_id: string;
  version: number;
  image_path: string | null;
  image_width: number;
  image_height: number;
  scale_m_per_px: number | null;
  elements: WireMap["elements"];
  price_zones: PriceZone[];
  sectors: {
    id: string;
    name: string;
    numbered: boolean;
    is_active: boolean;
    capacity: number;
    price: number | string;
    color: string;
    polygon: Point[];
    label_point: Point | null;
    seats: WireSeat[];
  }[];
};

export async function getEventSeatMap(eventId: string): Promise<EventSeatMap | null> {
  const { data, error } = await createClient().rpc("get_event_seat_admin", { p_event_id: eventId });
  if (error) throw error;
  if (!data) return null;
  const w = data as Wire;
  return {
    eventId: w.event_id,
    title: w.title,
    venueId: w.venue_id,
    version: w.version,
    imagePath: w.image_path,
    imageWidth: w.image_width,
    imageHeight: w.image_height,
    scaleMPerPx: w.scale_m_per_px == null ? null : Number(w.scale_m_per_px),
    // Same element format as the venue plan.
    elements: mapFromWire({
      id: "",
      venue_id: w.venue_id,
      version: w.version,
      status: "published",
      image_path: w.image_path,
      image_width: w.image_width,
      image_height: w.image_height,
      scale_m_per_px: null,
      calibration: null,
      notes: null,
      updated_at: "",
      published_at: null,
      sections: [],
      elements: w.elements ?? [],
    }).elements,
    zones: (w.price_zones ?? []).map((z) => ({ ...z, price: Number(z.price) })),
    sectors: w.sectors.map((s) => ({
      id: s.id,
      name: s.name,
      numbered: s.numbered,
      isActive: s.is_active,
      capacity: s.capacity,
      price: Number(s.price),
      color: s.color,
      polygon: s.polygon,
      labelPoint: s.label_point,
      seats: s.seats.map(([id, rowLabel, label, number, x, y, kind, state, zoneId, blockReason]) => ({
        id,
        sectorId: s.id,
        rowLabel,
        label,
        number,
        x: Number(x),
        y: Number(y),
        kind,
        state,
        zoneId,
        blockReason,
      })),
    })),
  };
}

/** Applies one change to many seats. Seats reserved or sold are skipped when blocking. */
export async function updateEventSeats(eventId: string, seatIds: string[], changes: SeatChanges): Promise<{ updated: number; skipped: number }> {
  const { data, error } = await createClient().rpc("update_event_seats", { p_event_id: eventId, p_seat_ids: seatIds, p_changes: changes });
  if (error) throw error;
  return data as { updated: number; skipped: number };
}

export class ZoneNameTakenError extends Error {}

export async function saveZone(eventId: string, zone: Omit<PriceZone, "id"> & { id?: string }, sortOrder: number): Promise<PriceZone> {
  const supabase = createClient();
  const row = { event_id: eventId, name: zone.name.trim(), color: zone.color, price: zone.price, sort_order: sortOrder };
  const query = zone.id
    ? supabase.from("event_price_zones").update(row).eq("id", zone.id).select("id, name, color, price").single()
    : supabase.from("event_price_zones").insert(row).select("id, name, color, price").single();
  const { data, error } = await query;
  if (error) throw error.code === "23505" ? new ZoneNameTakenError(error.message) : error;
  return { ...data, price: Number(data.price) } as PriceZone;
}

/** Seats of a deleted zone go back to their sector's price. */
export async function deleteZone(id: string): Promise<void> {
  const { error } = await createClient().from("event_price_zones").delete().eq("id", id);
  if (error) throw error;
}

/** The event card's "desde" price after sector prices change. */
export async function refreshEventPriceBase(eventId: string): Promise<void> {
  const { error } = await createClient().rpc("refresh_event_price_base", { p_event_id: eventId });
  if (error) throw error;
}
