import { createClient } from "@/lib/supabase/client";

// Attendee list of an event: one row per ticket (sold or courtesy) with its
// holder, seat, purchase and door validation.

export type AttendeeKind = "sale" | "cortesia" | "prensa";
export type TicketStatus = "valid" | "used" | "void";

export type Attendee = {
  id: string;
  holder: string | null;
  document: string | null;
  email: string | null;
  sector: string;
  seat: string;
  status: TicketStatus;
  used_at: string | null;
  used_gate: string | null;
  validated_by: string | null;
  kind: AttendeeKind;
  order_code: string;
  order_status: string;
  buyer: string;
  buyer_email: string;
  buyer_document: string | null;
  buyer_phone: string | null;
  purchased_at: string;
  order_total: number;
  price: number | null;
  note: string | null;
  issued_by: string | null;
};

export async function getEventAttendees(eventId: string): Promise<Attendee[]> {
  const { data, error } = await createClient().rpc("event_attendees", { p_event_id: eventId });
  if (error) throw new Error(error.message.includes("FORBIDDEN") ? "Tu rol no permite ver los asistentes de este evento." : "No pudimos cargar la lista de asistentes.");
  return (data ?? []) as Attendee[];
}

export const KIND_LABEL: Record<AttendeeKind, string> = { sale: "Venta", cortesia: "Cortesía", prensa: "Prensa" };
export const STATUS_LABEL: Record<TicketStatus, string> = { used: "Ingresó", valid: "Por ingresar", void: "Anulada" };

const dateTime = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date(iso)) : "";

/** CSV for Excel in Spanish: semicolons, a BOM so accents survive, one row per ticket. */
export function attendeesCsv(rows: Attendee[]) {
  const header = [
    "Asistente", "Documento", "Correo", "Sector", "Ubicación", "Tipo", "Estado", "Ingreso", "Puerta", "Validó",
    "Orden", "Comprador", "Correo comprador", "Teléfono", "Fecha compra", "Precio entrada", "Total orden", "Emitida por", "Nota",
  ];
  const cell = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((a) =>
    [
      a.holder ?? "Sin nominar", a.document, a.email, a.sector, a.seat, KIND_LABEL[a.kind], STATUS_LABEL[a.status], dateTime(a.used_at), a.used_gate, a.validated_by,
      a.order_code, a.buyer, a.buyer_email, a.buyer_phone, dateTime(a.purchased_at), a.price, a.order_total, a.issued_by, a.note,
    ].map(cell).join(";")
  );
  return "﻿" + [header.join(";"), ...lines].join("\r\n");
}
