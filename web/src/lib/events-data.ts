import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CACHE_SECONDS, createPublicClient } from "@/lib/supabase/public";
import type { Slide } from "@/components/Hero";
import { type EventCardData, type EventRow, toEventCardData, toHeroSlide } from "@/lib/events";

type LivePrice = { event_id: string; min_price: number | null; normal_min_price: number | null; phase_name: string | null };

/** Cards show today's price: during a presale price_base is replaced by the presale price. */
async function withLivePrices(rows: EventRow[]): Promise<EventRow[]> {
  if (rows.length === 0) return rows;
  const { data, error } = await createPublicClient().rpc("get_event_prices", { p_event_ids: rows.map((r) => r.id) });
  if (error || !data) return rows;
  const live = new Map((data as LivePrice[]).map((p) => [p.event_id, p]));
  return rows.map((row) => {
    const p = live.get(row.id);
    if (!p) return row;
    return { ...row, price_base: p.min_price ?? row.price_base, sale_phase_name: p.phase_name };
  });
}

// Published events are the same for every visitor: cached and shared (see CACHE_SECONDS).
const publishedRows = unstable_cache(
  async (): Promise<EventRow[]> => {
    const { data } = await createPublicClient().from("events").select("*").neq("status", "borrador").order("event_date", { ascending: true });
    return withLivePrices((data ?? []) as EventRow[]);
  },
  ["published-events"],
  { revalidate: CACHE_SECONDS.events, tags: ["events"] }
);

const heroRows = unstable_cache(
  async (): Promise<EventRow[]> => {
    const { data } = await createPublicClient()
      .from("events")
      .select("*")
      .eq("show_in_hero", true)
      .neq("status", "borrador")
      .order("event_date", { ascending: true })
      .limit(5);
    return withLivePrices((data ?? []) as EventRow[]);
  },
  ["hero-events"],
  { revalidate: CACHE_SECONDS.events, tags: ["events"] }
);

const publishedRowBySlug = unstable_cache(
  async (slug: string): Promise<EventRow | null> => {
    const { data } = await createPublicClient().from("events").select("*").eq("slug", slug).neq("status", "borrador").maybeSingle();
    return (data as EventRow) ?? null;
  },
  ["event-by-slug"],
  { revalidate: CACHE_SECONDS.events, tags: ["events"] }
);

export const getPublishedEventRows = cache(async (): Promise<EventRow[]> => publishedRows());

export const getAllEvents = cache(async (): Promise<EventCardData[]> => {
  return (await getPublishedEventRows()).map(toEventCardData);
});

export const getHeroEvents = cache(async (): Promise<Slide[]> => (await heroRows()).map(toHeroSlide));

export const getEventRowBySlug = cache(async (slug: string): Promise<EventRow | undefined> => {
  const published = await publishedRowBySlug(slug);
  if (published) return published;
  // Drafts aren't public: staff previewing one read it with their own session (not cached).
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  return (data as EventRow) ?? undefined;
});
