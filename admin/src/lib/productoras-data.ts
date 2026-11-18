import { createClient } from "@/lib/supabase/client";
import { missingFunction } from "@/lib/validation-data";

// Productoras: each one manages only its own events. Platform admins create
// them and give each one its owner (database functions in
// 20261111120000_productoras.sql).

/** pending: invited but never signed in (the invitation can be sent again). */
export type ProductoraMember = { name: string; email: string; role: string; pending?: boolean };

export type ProductoraContact = { first_name: string | null; last_name: string | null; email: string; phone: string | null };

export type Productora = {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  /** ISO code, "CL" by default. Missing before the productora profile migration. */
  country?: string;
  /** Representative (legal representative or person in charge); null for older productoras. */
  contact?: ProductoraContact | null;
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
  OTHER_TEAM: "Ese correo ya es del equipo de la plataforma o de otra productora.",
};

const inviteMessages: Record<string, string> = {
  ...messages,
  INVALID_EMAIL: "Revisa el correo: no parece válido.",
  IS_CUSTOMER: "Ese correo ya es de un cliente de Aforiq. Usa otro correo para la cuenta de la productora.",
  ALREADY_ACTIVE: "Esa persona ya activó su cuenta y puede entrar al panel.",
  RATE_LIMITED: "Se enviaron demasiados correos seguidos. Espera unos minutos y vuelve a intentarlo.",
  UNAUTHENTICATED: "Tu sesión expiró. Vuelve a iniciar sesión.",
  NOT_CONFIGURED: "Falta configurar la clave de servicio de Supabase en el panel (SUPABASE_SERVICE_ROLE_KEY).",
  MIGRATION_PENDING: "Falta aplicar la actualización de base de datos de productoras.",
  INVALID_COUNTRY: "Elige el país de la productora.",
  INVALID_FIRST_NAME: "Escribe el nombre del representante.",
  INVALID_LAST_NAME: "Escribe el apellido del representante.",
  INVALID_PHONE: "Revisa el teléfono: no tiene el largo de un número de ese país.",
  CREATE_FAILED: "No pudimos crear la productora. Inténtalo de nuevo.",
  REQUEST_NOT_FOUND: "Esa solicitud ya no existe. Recarga la página.",
  REQUEST_ALREADY_APPROVED: "Esa solicitud ya fue aprobada.",
  IS_DEFAULT: "La productora principal de la plataforma no se puede eliminar.",
  NAME_MISMATCH: "El nombre no coincide. Escríbelo tal como aparece.",
  HAS_EVENTS: "Esta productora tiene eventos. Elimínalos primero desde Eventos.",
  HAS_DATA: "Esta productora todavía tiene datos asociados y no se puede eliminar.",
  DELETE_FAILED: "No pudimos eliminar la productora. Inténtalo de nuevo.",
};

async function post<T>(url: string, payload: unknown, fallback: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  } catch {
    throw new Error("No hay conexión. Revisa tu internet e inténtalo de nuevo.");
  }
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok || body.error) throw new ProductoraError(body.error ?? "", inviteMessages[body.error ?? ""] ?? fallback);
  return body;
}

/** A failed request, with the server's code (e.g. IS_CUSTOMER) to point at the field. */
export class ProductoraError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export type NewProductora = { country: string; name: string; firstName: string; lastName: string; email: string; phone: string };

/** «Aprobar» in Solicitudes: also marks that producer request as approved. */
export type NewProductoraRequest = NewProductora & { requestId?: string };

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

/** Creates the productora with its profile and e-mails the invitation to its representative. */
export async function createProductora(data: NewProductoraRequest): Promise<string> {
  const body = await post<{ id: string }>("/api/productoras/", data, "No pudimos crear la productora. Inténtalo de nuevo.");
  return body.id;
}

/**
 * Creates the owner's productora account and e-mails the invitation (or sends
 * it again if they haven't accepted yet). The e-mail doesn't need an Aforiq account.
 */
export async function inviteProductoraOwner(orgId: string, email: string): Promise<"invited" | "resent"> {
  const body = await post<{ status: "invited" | "resent" }>(
    "/api/productoras/invitar/",
    { orgId, email: email.trim() },
    "No pudimos enviar la invitación. Inténtalo de nuevo."
  );
  return body.status;
}

/**
 * Deletes a productora without events. Accounts created only for its panel are
 * deleted too; anyone else on its team goes back to being a customer.
 */
export async function deleteProductora(orgId: string, name: string): Promise<{ accounts_deleted: number; members_detached: number }> {
  return post("/api/productoras/eliminar/", { orgId, name }, "No pudimos eliminar la productora. Inténtalo de nuevo.");
}
