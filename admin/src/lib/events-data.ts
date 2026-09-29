import { createClient } from "@/lib/supabase/client";

export const EVENTS_FLASH_KEY = "eventos:flash";

export type EventStatus = "borrador" | "en-venta" | "casi-agotado" | "proximamente" | "finalizado";

export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  venue: string;
  city: string;
  address: string | null;
  venue_id: string | null;
  category: string | null;
  artist: string | null;
  event_date: string;
  doors_open: string | null;
  image_url: string | null;
  hero_image_url: string | null;
  banner_image_url: string | null;
  price_base: number;
  capacity: number;
  sold: number;
  status: EventStatus;
  show_in_hero: boolean;
  sale_start: string | null;
  max_tickets_per_order: number;
  qr_validation: boolean;
  age_restriction: boolean;
  created_at: string;
  updated_at: string;
};

export type SectorInput = {
  id?: string;
  name: string;
  short_label: string;
  capacity: number;
  price: number;
  color: string;
  shape_rect: [number, number, number, number] | null;
  shape_path: string | null;
  label_x: number | null;
  label_y: number | null;
  is_active: boolean;
  sort_order: number;
};

export type EventSectorRecord = SectorInput & { id: string; event_id: string };

export type EventInput = {
  title: string;
  subtitle: string;
  description: string;
  venue_id: string | null;
  venue: string;
  city: string;
  address: string;
  category: string;
  artist: string;
  event_date: string;
  doors_open: string;
  image_url: string;
  hero_image_url: string;
  banner_image_url: string;
  sold: number;
  status: EventStatus;
  show_in_hero: boolean;
  sale_start: string;
  max_tickets_per_order: number;
  qr_validation: boolean;
  age_restriction: boolean;
  sectors: SectorInput[];
  // Used only when `sectors` is empty (events created before sectors existed).
  capacity: number;
  price_base: number;
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function computeCapacityAndPrice(sectors: SectorInput[]): { capacity: number; price_base: number } {
  const active = sectors.filter((s) => s.is_active);
  const capacity = active.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
  const prices = active.map((s) => Number(s.price) || 0).filter((p) => p > 0);
  const price_base = prices.length ? Math.min(...prices) : 0;
  return { capacity, price_base };
}

function eventPayload(input: EventInput) {
  const { capacity, price_base } =
    input.sectors.length > 0 ? computeCapacityAndPrice(input.sectors) : { capacity: input.capacity, price_base: input.price_base };
  return {
    title: input.title,
    subtitle: input.subtitle || null,
    description: input.description || null,
    venue_id: input.venue_id,
    venue: input.venue,
    city: input.city,
    address: input.address || null,
    category: input.category || null,
    artist: input.artist || null,
    event_date: input.event_date,
    doors_open: input.doors_open || null,
    image_url: input.image_url || null,
    hero_image_url: input.hero_image_url || null,
    banner_image_url: input.banner_image_url || null,
    price_base,
    capacity,
    sold: input.sold,
    status: input.status,
    show_in_hero: input.show_in_hero,
    sale_start: input.sale_start || null,
    max_tickets_per_order: input.max_tickets_per_order,
    qr_validation: input.qr_validation,
    age_restriction: input.age_restriction,
  };
}

async function replaceSectors(eventId: string, sectors: SectorInput[]) {
  const supabase = createClient();
  const { error: deleteError } = await supabase.from("event_sectors").delete().eq("event_id", eventId);
  if (deleteError) throw deleteError;

  if (sectors.length === 0) return;

  const { error: insertError } = await supabase.from("event_sectors").insert(
    sectors.map((s, index) => ({
      event_id: eventId,
      name: s.name,
      short_label: s.short_label,
      capacity: s.capacity,
      price: s.price,
      color: s.color,
      shape_rect: s.shape_rect,
      shape_path: s.shape_path,
      label_x: s.label_x,
      label_y: s.label_y,
      is_active: s.is_active,
      sort_order: index,
    }))
  );
  if (insertError) throw insertError;
}

export async function listEvents(): Promise<EventRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listEventSectors(eventId: string): Promise<EventSectorRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("event_sectors").select("*").eq("event_id", eventId).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getEvent(id: string): Promise<EventRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createEvent(input: EventInput): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const slug = `${slugify(input.title)}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("events")
    .insert({ ...eventPayload(input), slug, producer_id: user?.id ?? null })
    .select("id")
    .single();
  if (error) throw error;

  await replaceSectors(data.id, input.sectors);
  return data.id;
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("events").update(eventPayload(input)).eq("id", id);
  if (error) throw error;

  await replaceSectors(id, input.sectors);
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadEventImage(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `event-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("events").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("events").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
