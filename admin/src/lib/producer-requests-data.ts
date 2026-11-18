import { createClient } from "@/lib/supabase/client";
import { DEFAULT_COUNTRY, countryByCode } from "@/lib/countries";
import type { NewProductora } from "@/lib/productoras-data";

// Requests sent from aforiq.cl/organizadores by producers who want to sell
// with Aforiq (table producer_requests). Only platform admins read them.

export type RequestStatus = "nuevo" | "contactado" | "aprobado" | "descartado";

export type ProducerRequest = {
  id: string;
  created_at: string;
  updated_at: string;
  status: RequestStatus;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone: string;
  city: string | null;
  event_name: string | null;
  category: string | null;
  tentative_date: string | null;
  expected_attendees: string | null;
  event_url: string | null;
  message: string | null;
  admin_notes: string | null;
  organization_id?: string | null;
  /** ISO code chosen in the form; missing on requests from before it asked. */
  country?: string | null;
};

/** The producer_requests table isn't in the database yet. */
export class RequestsUnavailable extends Error {}

export async function fetchProducerRequests(): Promise<ProducerRequest[]> {
  const { data, error } = await createClient().from("producer_requests").select("*").order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") throw new RequestsUnavailable();
    throw new Error("No pudimos cargar las solicitudes.");
  }
  return (data ?? []) as ProducerRequest[];
}

/** New requests, for the badge in the menu. 0 if they can't be read. */
export async function countNewProducerRequests(): Promise<number> {
  const { count, error } = await createClient().from("producer_requests").select("id", { count: "exact", head: true }).eq("status", "nuevo");
  return error ? 0 : (count ?? 0);
}

export async function updateProducerRequest(id: string, patch: { status?: RequestStatus; admin_notes?: string | null }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("producer_requests")
    .update({ ...patch, updated_at: new Date().toISOString(), ...(patch.status ? { handled_by: auth.user?.id ?? null } : {}) })
    .eq("id", id);
  if (error) throw new Error("No pudimos guardar el cambio. Inténtalo de nuevo.");
}

/** «Aprobar»: the «Nueva productora» form filled with the request. */
export function productoraFromRequest(r: ProducerRequest): NewProductora {
  const country = countryByCode(r.country) ?? countryByCode(DEFAULT_COUNTRY)!;
  // The phone as typed on the site; without the country code, which the form shows apart.
  let phone = r.phone.replace(/\D/g, "");
  if (phone.startsWith(country.dial) && phone.length > country.phoneDigits[1]) phone = phone.slice(country.dial.length);
  return { country: country.code, name: r.company, firstName: r.first_name, lastName: r.last_name, email: r.email, phone };
}
