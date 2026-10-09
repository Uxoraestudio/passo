import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

import { planImageUrl, type EventPlan, type PlanElement, type PlanSeatKind, type PlanSeatState, type Point } from "@/lib/seat-plan-types";

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
  return {
    imageUrl: w.image_path ? planImageUrl(w.image_path) : null,
    width: w.image_width,
    height: w.image_height,
    elements: w.elements ?? [],
    sectors: w.sectors.map((s) => ({
      id: s.id,
      name: s.name,
      shortLabel: s.short_label,
      numbered: s.numbered,
      capacity: s.capacity,
      price: Number(s.price),
      color: s.color,
      polygon: s.polygon,
      labelPoint: s.label_point,
      seats: s.seats.map(([rowLabel, label, number, x, y, kind, state]) => ({ rowLabel, label, number, x: Number(x), y: Number(y), kind, state })),
    })),
  };
});
