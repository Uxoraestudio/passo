import { createClient } from "@/lib/supabase/client";

export type EventStatus = "borrador" | "en-venta" | "casi-agotado" | "proximamente" | "finalizado";

export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  venue: string;
  city: string;
  event_date: string;
  image_url: string | null;
  price_base: number;
  capacity: number;
  sold: number;
  status: EventStatus;
  created_at: string;
  updated_at: string;
};

export type EventInput = {
  title: string;
  subtitle: string;
  description: string;
  venue: string;
  city: string;
  event_date: string;
  image_url: string;
  price_base: number;
  capacity: number;
  sold: number;
  status: EventStatus;
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listEvents(): Promise<EventRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(input: EventInput): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const slug = `${slugify(input.title)}-${Date.now().toString(36)}`;

  const { error } = await supabase.from("events").insert({
    title: input.title,
    subtitle: input.subtitle || null,
    description: input.description || null,
    venue: input.venue,
    city: input.city,
    event_date: input.event_date,
    image_url: input.image_url || null,
    price_base: input.price_base,
    capacity: input.capacity,
    sold: input.sold,
    status: input.status,
    slug,
    producer_id: user?.id ?? null,
  });
  if (error) throw error;
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("events")
    .update({
      title: input.title,
      subtitle: input.subtitle || null,
      description: input.description || null,
      venue: input.venue,
      city: input.city,
      event_date: input.event_date,
      image_url: input.image_url || null,
      price_base: input.price_base,
      capacity: input.capacity,
      sold: input.sold,
      status: input.status,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
