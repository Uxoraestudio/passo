import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { describeSeat } from "@/lib/seatMap";
import { loadSeatParts } from "@/lib/seat-details";

export type IssuedTicket = {
  id: string;
  code: string;
  sectorId: string;
  sectorName: string;
  seatLabel: string | null;
  row: string | null;
  number: number | null;
  /** "Fila A · Asiento 4", or "Acceso general". */
  seatText: string;
  holderName: string | null;
  status: "valid" | "used" | "void";
};

/** Tickets of one order (RLS limits them to the buyer and staff), seats in order. */
export async function loadOrderTickets(orderId: string): Promise<IssuedTicket[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("id, code, sector_id, sector_name, seat_label, holder_name, status")
    .eq("order_id", orderId)
    .order("seat_label", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as {
    id: string;
    code: string;
    sector_id: string;
    sector_name: string;
    seat_label: string | null;
    holder_name: string | null;
    status: IssuedTicket["status"];
  }[];
  const parts = await loadSeatParts(
    supabase,
    rows.filter((t) => t.seat_label).map((t) => ({ sectorId: t.sector_id, label: t.seat_label! }))
  );
  return rows.map((t) => {
    const seat = t.seat_label ? parts.get(`${t.sector_id}:${t.seat_label}`) : undefined;
    return {
      id: t.id,
      code: t.code,
      sectorId: t.sector_id,
      sectorName: t.sector_name,
      seatLabel: t.seat_label,
      row: seat?.row ?? null,
      number: seat?.number ?? null,
      seatText: t.seat_label ? describeSeat(t.seat_label, seat?.row, seat?.number) : "Acceso general",
      holderName: t.holder_name,
      status: t.status,
    };
  });
}

/** QR of a ticket as inline SVG. It carries the ticket's unguessable code, which the door scanner validates. */
export function ticketQrSvg(code: string) {
  return QRCode.toString(code, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#140924", light: "#ffffff" } });
}
