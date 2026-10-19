import { createClient } from "@/lib/supabase/client";
import { LAYOUTS, type BaseShape, type LayoutKey } from "@/lib/venue-layouts";

export type Venue = {
  id: string;
  name: string;
  city: string;
  type: string;
  layout_key: LayoutKey;
  scale: number;
  gradient: string | null;
  is_custom: boolean;
  base_shapes: BaseShape[];
  address?: string | null;
  /** Latest published seat map (venue_maps), if the venue has one. */
  published_map_id?: string | null;
};

export async function listVenues(): Promise<Venue[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("venues").select("*").order("is_custom").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("venues").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createVenue(input: { name: string; city: string; address?: string }): Promise<Venue> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("venues")
    .insert({
      name: input.name,
      city: input.city,
      type: "Manual",
      layout_key: "custom",
      scale: 1,
      gradient: null,
      is_custom: true,
      base_shapes: [],
      address: input.address?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export function venueCapacity(venue: Venue): number | null {
  if (venue.is_custom || venue.layout_key === "custom") return null;
  const layout = LAYOUTS[venue.layout_key];
  return layout.sectors.reduce((sum, s) => sum + Math.round((s.cap * venue.scale) / 100) * 100, 0);
}

export function sectorCountFor(venue: Venue): number {
  if (venue.is_custom || venue.layout_key === "custom") return 0;
  return LAYOUTS[venue.layout_key].sectors.length;
}

/** Deletes a venue and its plans. Refused while an event uses it. */
export async function deleteVenue(id: string): Promise<void> {
  const { error } = await createClient().rpc("delete_venue", { p_venue_id: id });
  if (!error) return;
  const inUse = error.message.match(/VENUE_IN_USE:(.+)/);
  if (inUse) throw new Error(`No se puede eliminar: lo usa ${inUse[1].includes(",") ? "los eventos" : "el evento"} «${inUse[1]}». Elimina o cambia de recinto ese evento primero.`);
  if (error.message.includes("FORBIDDEN")) throw new Error("Tu rol no permite eliminar recintos.");
  throw new Error("No pudimos eliminar el recinto. Inténtalo de nuevo.");
}
