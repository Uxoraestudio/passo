import "server-only";
import { createClient } from "@supabase/supabase-js";

/** The service-role key isn't set (locally: admin/.env.local; Vercel: aforiq-admin). */
export class ServiceKeyMissing extends Error {}

// Service-role client: bypasses RLS. Only for route handlers, never for "use client" modules.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new ServiceKeyMissing("SUPABASE_SERVICE_ROLE_KEY no está configurada.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
