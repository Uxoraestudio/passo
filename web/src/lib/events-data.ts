import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Slide } from "@/components/Hero";
import { type EventCardData, type EventRow, toEventCardData, toHeroSlide } from "@/lib/events";

export const getAllEvents = cache(async (): Promise<EventCardData[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .neq("status", "borrador")
    .order("event_date", { ascending: true });

  return (data ?? []).map((row) => toEventCardData(row as EventRow));
});

export const getHeroEvents = cache(async (): Promise<Slide[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("show_in_hero", true)
    .neq("status", "borrador")
    .order("event_date", { ascending: true })
    .limit(5);

  return (data ?? []).map((row) => toHeroSlide(row as EventRow));
});

export const getEventRowBySlug = cache(async (slug: string): Promise<EventRow | undefined> => {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  return (data as EventRow) ?? undefined;
});
