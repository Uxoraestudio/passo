import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

import { planImageUrl, type EventPlan, type PlanElement, type PlanSeat, type PlanSeatKind, type PlanSeatState, type PlanZone, type Point } from "@/lib/seat-plan-types";

export type * from "@/lib/seat-plan-types";

type WireSeat = [string | null, string, number | null, number, number, PlanSeatKind, PlanSeatState, string | null];

/** The event's plan with live seat states, or null when the event has no plan. */
export const getEventPlan = cache(async (eventId: string): Promise<EventPlan | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_event_seat_map", { p_event_id: eventId });
  if (error || !data) return null;
  const w = data as {
    image_path: string | null;
    image_width: number;
    image_height: number;
    elements: PlanElement[];
    price_zones: PlanZone[];
    sectors: {
      id: string;
      name: string;
      short_label: string | null;
      numbered: boolean;
      capacity: number;
      price: number | string;
      color: string;
      polygon: Point[];
      label_point: Point | null;
      seats: WireSeat[];
    }[];
  };
  const zones = new Map((w.price_zones ?? []).map((z) => [z.id, { ...z, price: Number(z.price) }]));
  return {
    imageUrl: w.image_path ? planImageUrl(w.image_path) : null,
    width: w.image_width,
    height: w.image_height,
    elements: w.elements ?? [],
    zones: [...zones.values()],
    sectors: w.sectors.map((s) => {
      const sectorPrice = Number(s.price);
      const seats: PlanSeat[] = s.seats.map(([rowLabel, label, number, x, y, kind, state, zoneId]) => ({
        rowLabel,
        label,
        number,
        x: Number(x),
        y: Number(y),
        kind,
        state,
        zoneId,
        price: (zoneId && zones.get(zoneId)?.price) || sectorPrice,
      }));
      const free = seats.filter((seat) => seat.state === "AVAILABLE").map((seat) => seat.price);
      const min = free.length ? Math.min(...free) : sectorPrice;
      const max = free.length ? Math.max(...free) : sectorPrice;
      return {
        id: s.id,
        name: s.name,
        shortLabel: s.short_label,
        numbered: s.numbered,
        capacity: s.capacity,
        price: min,
        priceMax: max > min ? max : null,
        color: s.color,
        polygon: s.polygon,
        labelPoint: s.label_point,
        seats,
      };
    }),
  };
});
