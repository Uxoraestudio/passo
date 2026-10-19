import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Anonymous client without cookies, for public data (published events,
 * prices, availability, site settings). Its results don't depend on who is
 * looking, so they can be cached and shared by every visitor.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * How long each kind of public data may be reused, in seconds. Short enough
 * that the site feels live; long enough that a rush of buyers costs a handful
 * of database queries instead of one per visit. Purchases never read from the
 * cache: create_order always checks the live database.
 */
export const CACHE_SECONDS = {
  /** Logos, colors, SEO texts: change rarely. */
  settings: 300,
  /** Event lists, event details, card prices. */
  events: 30,
  /** Sector prices, availability and the current presale. */
  sale: 10,
  /** Seat states in the seat map. */
  seats: 5,
} as const;
