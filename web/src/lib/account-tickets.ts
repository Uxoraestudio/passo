import { createClient } from "@/lib/supabase/server";
import { pickImage } from "@/lib/events";
import { describeSeat } from "@/lib/seatMap";
import { loadSeatParts, type SeatParts } from "@/lib/seat-details";
import { ticketQrSvg } from "@/lib/order-tickets";

export type TicketStatus = "confirmada" | "usada" | "cancelada";

/** One ticket of a card, with its real QR (inline SVG). */
export type AccountEntry = { id: string; seatText: string; holderName: string | null; qrSvg: string; valid: boolean };

export type AccountTicket = {
  id: string;
  orderId: string;
  orderCode: string;
  status: TicketStatus;
  quantity: number;
  sector: string;
  seats: string | null;
  entries: AccountEntry[];
  event: {
    slug: string;
    title: string;
    subtitle: string;
    image: string;
    venue: string;
    city: string;
    dateLong: string;
    time: string;
    day: string;
    month: string;
    daysLeft: number;
  };
};

const TIME_ZONE = "America/Santiago";

type TicketRow = {
  id: string;
  code: string;
  holder_name: string | null;
  order_id: string;
  sector_id: string;
  sector_name: string;
  seat_label: string | null;
  status: "valid" | "used" | "void";
  order: { code: string } | null;
  event: {
    slug: string;
    title: string;
    subtitle: string | null;
    image_url: string | null;
    banner_image_url: string | null;
    venue: string;
    city: string;
    event_date: string;
    status: string;
  } | null;
};

/** "Fila A · Asiento 4" for one seat, "Asientos A4, A5" for several. */
function seatsLabel(rows: TicketRow[], parts: Map<string, SeatParts>) {
  const seated = rows.filter((r) => r.seat_label);
  if (seated.length === 0) return null;
  const part = (r: TicketRow) => parts.get(`${r.sector_id}:${r.seat_label}`);
  if (seated.length === 1) return describeSeat(seated[0].seat_label!, part(seated[0])?.row, part(seated[0])?.number);
  const short = seated.map((r) => {
    const p = part(r);
    return p?.row && p.number != null ? `${p.row}${p.number}` : r.seat_label!;
  });
  return `Asientos ${short.sort((a, b) => a.localeCompare(b, "es", { numeric: true })).join(", ")}`;
}

/** The signed-in buyer's tickets, one card per order and sector (RLS limits rows to their own). */
export async function getAccountTickets(now = Date.now()): Promise<AccountTicket[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(
      "id, code, holder_name, order_id, sector_id, sector_name, seat_label, status, order:orders(code), event:events(slug, title, subtitle, image_url, banner_image_url, venue, city, event_date, status)"
    )
    .order("created_at", { ascending: false });

  const all = (data ?? []) as unknown as TicketRow[];
  const parts = await loadSeatParts(
    supabase,
    all.filter((r) => r.seat_label).map((r) => ({ sectorId: r.sector_id, label: r.seat_label! }))
  );
  const qrs = new Map(await Promise.all(all.map(async (r) => [r.id, await ticketQrSvg(r.code)] as const)));

  const groups = new Map<string, TicketRow[]>();
  for (const row of all) {
    if (!row.event) continue;
    const key = `${row.order_id}:${row.sector_id}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return Array.from(groups, ([key, rows]) => {
    const first = rows[0];
    const event = first.event!;
    const isPast = new Date(event.event_date).getTime() < now || event.status === "finalizado";
    const status: TicketStatus = rows.every((r) => r.status === "void")
      ? "cancelada"
      : isPast || rows.every((r) => r.status === "used")
        ? "usada"
        : "confirmada";

    const sorted = [...rows].sort((a, b) => (a.seat_label ?? "").localeCompare(b.seat_label ?? "", "es", { numeric: true }));
    return {
      id: key,
      orderId: first.order_id,
      orderCode: first.order?.code ?? "",
      status,
      quantity: rows.filter((r) => r.status !== "void").length || rows.length,
      sector: first.sector_name,
      seats: seatsLabel(rows, parts),
      entries: sorted.map((r) => {
        const p = r.seat_label ? parts.get(`${r.sector_id}:${r.seat_label}`) : undefined;
        return {
          id: r.id,
          seatText: r.seat_label ? describeSeat(r.seat_label, p?.row, p?.number) : "Acceso general",
          holderName: r.holder_name,
          qrSvg: qrs.get(r.id) ?? "",
          valid: r.status === "valid",
        };
      }),
      event: {
        slug: event.slug,
        title: event.title,
        subtitle: event.subtitle ?? "",
        image: pickImage(event.image_url, event.banner_image_url),
        venue: event.venue,
        city: event.city,
        dateLong: formatTicketDate(event.event_date),
        time: formatTicketTime(event.event_date),
        ...formatDayMonth(event.event_date),
        daysLeft: daysUntil(event.event_date, now),
      },
    };
  }).sort((a, b) => a.event.daysLeft - b.event.daysLeft);
}

export function formatTicketDate(iso: string) {
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE }).format(
    new Date(iso)
  );
}

export function formatTicketTime(iso: string) {
  const parts = new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TIME_ZONE }).formatToParts(
    new Date(iso)
  );
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${pick("hour")}:${pick("minute")} h`;
}

export function formatDayMonth(iso: string) {
  const parts = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", timeZone: TIME_ZONE }).formatToParts(new Date(iso));
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = (parts.find((p) => p.type === "month")?.value ?? "").replace(".", "").toUpperCase();
  return { day, month };
}

export function daysUntil(iso: string, now = Date.now()) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 86_400_000));
}
