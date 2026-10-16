import { createClient } from "@/lib/supabase/client";

// Door validation: checks a ticket (QR code or the short code printed on it)
// and the live numbers of the event. All of it goes through database
// functions that only staff with access to "Validación" can call.

export type ScanResult = "valid" | "already_used" | "void" | "wrong_event" | "not_found";

export type ScannedTicket = {
  holder: string | null;
  document: string | null;
  sector: string;
  seat: string;
  used_at: string | null;
  used_gate: string | null;
  event: string;
};

export type ValidationResponse = { result: ScanResult; ticket: ScannedTicket | null };

export type RecentScan = {
  id: number;
  at: string;
  result: ScanResult;
  gate: string | null;
  holder: string | null;
  sector: string | null;
  seat: string | null;
  input: string;
};

export type ValidationOverview = {
  tickets: number;
  entered: number;
  scans_ok: number;
  scans_rejected: number;
  last_15_min: number;
  by_result: Partial<Record<ScanResult, number>>;
  sectors: { name: string; tickets: number; entered: number }[];
  gates: { gate: string; entered: number; rejected: number; last_at: string }[];
  recent: RecentScan[];
};

export type ValidationEvent = { id: string; title: string; event_date: string; venue: string; status: string };

export class ValidationError extends Error {}

const messages: Record<string, string> = {
  FORBIDDEN: "Tu rol no permite validar entradas.",
  EVENT_NOT_FOUND: "Ese evento ya no existe. Elige otro.",
  EMPTY_CODE: "Escanea un QR o escribe el código de la entrada.",
};

function toError(message: string | undefined, fallback: string) {
  const code = Object.keys(messages).find((k) => message?.includes(k));
  return new ValidationError(code ? messages[code] : fallback);
}

/** Events that can be validated: on sale or finished, from two days ago onwards. */
export async function listValidationEvents(): Promise<ValidationEvent[]> {
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const { data, error } = await createClient()
    .from("events")
    .select("id, title, event_date, venue, status")
    .in("status", ["en-venta", "casi-agotado", "finalizado"])
    .gte("event_date", since)
    .order("event_date", { ascending: true });
  if (error) throw toError(error.message, "No pudimos cargar los eventos.");
  return data ?? [];
}

export async function validateTicket(eventId: string, code: string, gate: string): Promise<ValidationResponse> {
  const { data, error } = await createClient().rpc("validate_ticket", { p_event_id: eventId, p_code: code, p_gate: gate || null });
  if (error) throw toError(error.message, "No pudimos validar la entrada. Revisa la conexión e inténtalo de nuevo.");
  return data as ValidationResponse;
}

export async function getValidationOverview(eventId: string): Promise<ValidationOverview> {
  const { data, error } = await createClient().rpc("validation_overview", { p_event_id: eventId });
  if (error) throw toError(error.message, "No pudimos actualizar los números del evento.");
  return data as ValidationOverview;
}

export const RESULT_TEXT: Record<ScanResult, { title: string; detail: string; tone: "ok" | "warn" | "bad" }> = {
  valid: { title: "Entrada válida", detail: "Acceso concedido", tone: "ok" },
  already_used: { title: "Entrada ya utilizada", detail: "No dejar pasar", tone: "warn" },
  void: { title: "Entrada anulada", detail: "No dejar pasar", tone: "bad" },
  wrong_event: { title: "Entrada de otro evento", detail: "No dejar pasar", tone: "bad" },
  not_found: { title: "Código no reconocido", detail: "No dejar pasar", tone: "bad" },
};
