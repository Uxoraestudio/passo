import { createClient } from "@/lib/supabase/client";
import { missingFunction } from "@/lib/validation-data";

// Productoras: each one manages only its own events. Platform admins create
// them and give each one its owner (database functions in
// 20261111120000_productoras.sql).

export type ProductoraMember = { name: string; email: string; role: string };

export type Productora = {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  events: number;
  events_on_sale: number;
  team: ProductoraMember[];
};

/** The productoras migration isn't applied yet. */
export class ProductorasUnavailable extends Error {}

const messages: Record<string, string> = {
  FORBIDDEN: "Solo un administrador de la plataforma puede gestionar productoras.",
  INVALID_NAME: "Escribe un nombre de al menos 2 letras.",
  NAME_TAKEN: "Ya existe una productora con ese nombre.",
  ORG_NOT_FOUND: "Esa productora ya no existe. Recarga la página.",
  USER_NOT_FOUND: "No existe una cuenta con ese correo. La persona debe registrarse primero en aforiq.cl.",
  OTHER_TEAM: "Esa cuenta ya es del equipo de la plataforma o de otra productora.",
};

function fail(error: { code?: string; message?: string }, fn: string, fallback: string): never {
  if (missingFunction(error, fn)) throw new ProductorasUnavailable();
  const key = Object.keys(messages).find((k) => error.message?.includes(k));
  throw new Error(key ? messages[key] : fallback);
}

export async function fetchProductoras(): Promise<Productora[]> {
  const { data, error } = await createClient().rpc("organizations_overview");
  if (error) fail(error, "organizations_overview", "No pudimos cargar las productoras.");
  return (data ?? []) as Productora[];
}

export async function createProductora(name: string): Promise<string> {
  const { data, error } = await createClient().rpc("create_organization", { p_name: name.trim() });
  if (error) fail(error, "create_organization", "No pudimos crear la productora. Inténtalo de nuevo.");
  return data as string;
}

export async function setProductoraOwner(orgId: string, email: string) {
  const { error } = await createClient().rpc("set_organization_owner", { p_org_id: orgId, p_email: email.trim() });
  if (error) fail(error, "set_organization_owner", "No pudimos asignar el dueño. Inténtalo de nuevo.");
}
