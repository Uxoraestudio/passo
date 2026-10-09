import { createClient } from "@/lib/supabase/server";
import { pickImage } from "@/lib/events";
import { describeSeat } from "@/lib/seatMap";
import type { OrderStatus } from "@/lib/payments";

const TIME_ZONE = "America/Santiago";

export type CheckoutTicketSlot = {
  /** Stable key for the slot: sector + seat, or sector + running index for general admission. */
  key: string;
  sectorId: string;
  sectorName: string;
  seatLabel: string | null;
  seatText: string;
  unitPrice: number;
};

export type CheckoutAttendee = {
  sectorId: string;
  seatLabel: string | null;
  firstName: string;
  lastName: string;
  document: string;
  birthDate: string;
};

export type CheckoutOrder = {
  id: string;
  code: string;
  status: OrderStatus;
  /** True when the order is still held for this buyer and payment hasn't started. */
  editable: boolean;
  paymentStarted: boolean;
  expiresAt: string;
  serverNow: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  buyer: { email: string; firstName: string; lastName: string; document: string; phone: string };
  event: {
    slug: string;
    title: string;
    subtitle: string;
    image: string;
    venue: string;
    city: string;
    dateLong: string;
    weekday: string;
    time: string;
    day: string;
    month: string;
    year: string;
  };
  lines: { sectorName: string; quantity: number; unitPrice: number; seats: string[] }[];
  slots: CheckoutTicketSlot[];
  attendees: CheckoutAttendee[];
};

type OrderRow = {
  id: string;
  code: string;
  status: OrderStatus;
  expires_at: string;
  flow_token: string | null;
  subtotal: number;
  service_fee: number;
  total: number;
  buyer_email: string;
  buyer_name: string | null;
  buyer_first_name: string | null;
  buyer_last_name: string | null;
  buyer_document: string | null;
  buyer_phone: string | null;
  event: {
    slug: string;
    title: string;
    subtitle: string | null;
    image_url: string | null;
    banner_image_url: string | null;
    venue: string;
    city: string;
    event_date: string;
  } | null;
  order_items: { sector_id: string; sector_name: string; quantity: number; unit_price: number; seat_labels: string[] }[];
  order_attendees: {
    position: number;
    sector_id: string;
    seat_label: string | null;
    first_name: string;
    last_name: string;
    document: string;
    birth_date: string;
  }[];
};

function datePart(iso: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-CL", { ...options, timeZone: TIME_ZONE }).format(new Date(iso));
}

export function seatText(label: string | null) {
  return label ? describeSeat(label) : "Acceso general";
}

export async function getCheckoutOrder(orderId: string, now = Date.now()): Promise<CheckoutOrder | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, code, status, expires_at, flow_token, subtotal, service_fee, total, buyer_email, buyer_name, buyer_first_name, buyer_last_name, buyer_document, buyer_phone, event:events(slug, title, subtitle, image_url, banner_image_url, venue, city, event_date), order_items(sector_id, sector_name, quantity, unit_price, seat_labels), order_attendees(position, sector_id, seat_label, first_name, last_name, document, birth_date)"
    )
    .eq("id", orderId)
    .maybeSingle();

  const row = data as unknown as OrderRow | null;
  if (!row || !row.event) return null;

  const expired = row.status === "pending" && new Date(row.expires_at).getTime() <= now;
  const status: OrderStatus = expired ? "expired" : row.status;

  // Plan seats carry their own row and number; grid seats are parsed from the label.
  const seatedSectors = row.order_items.filter((item) => item.seat_labels.length > 0).map((item) => item.sector_id);
  const planSeats = new Map<string, { row: string | null; number: number | null }>();
  if (seatedSectors.length > 0) {
    const { data: seats } = await supabase
      .from("event_seats")
      .select("sector_id, label, row_label, number")
      .in("sector_id", seatedSectors)
      .in("label", row.order_items.flatMap((item) => item.seat_labels));
    for (const s of (seats ?? []) as { sector_id: string; label: string; row_label: string | null; number: number | null }[]) {
      planSeats.set(`${s.sector_id}:${s.label}`, { row: s.row_label, number: s.number });
    }
  }
  const describe = (sectorId: string, label: string) => {
    const seat = planSeats.get(`${sectorId}:${label}`);
    return seat ? describeSeat(label, seat.row, seat.number) : seatText(label);
  };
  /** Short seat code for summaries ("H7"); plan labels may carry a sector prefix. */
  const shortSeat = (sectorId: string, label: string) => {
    const seat = planSeats.get(`${sectorId}:${label}`);
    return seat?.row && seat.number != null ? `${seat.row}${seat.number}` : label;
  };

  const slots: CheckoutTicketSlot[] = row.order_items.flatMap((item): CheckoutTicketSlot[] =>
    item.seat_labels.length > 0
      ? [...item.seat_labels]
          .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
          .map((seat) => ({
            key: `${item.sector_id}:${seat}`,
            sectorId: item.sector_id,
            sectorName: item.sector_name,
            seatLabel: seat,
            seatText: describe(item.sector_id, seat),
            unitPrice: item.unit_price,
          }))
      : Array.from({ length: item.quantity }, (_, i) => ({
          key: `${item.sector_id}:${i}`,
          sectorId: item.sector_id,
          sectorName: item.sector_name,
          seatLabel: null,
          seatText: seatText(null),
          unitPrice: item.unit_price,
        }))
  );

  const [fallbackFirst, ...fallbackRest] = (row.buyer_name ?? "").split(" ");
  const event = row.event;

  return {
    id: row.id,
    code: row.code,
    status,
    editable: status === "pending" && !row.flow_token,
    paymentStarted: Boolean(row.flow_token),
    expiresAt: row.expires_at,
    serverNow: now,
    subtotal: row.subtotal,
    serviceFee: row.service_fee,
    total: row.total,
    buyer: {
      email: row.buyer_email,
      firstName: row.buyer_first_name ?? fallbackFirst ?? "",
      lastName: row.buyer_last_name ?? fallbackRest.join(" "),
      document: row.buyer_document ?? "",
      phone: row.buyer_phone ?? "",
    },
    event: {
      slug: event.slug,
      title: event.title,
      subtitle: event.subtitle ?? "",
      image: pickImage(event.image_url, event.banner_image_url),
      venue: event.venue,
      city: event.city,
      dateLong: datePart(event.event_date, { day: "numeric", month: "long", year: "numeric" }),
      weekday: datePart(event.event_date, { weekday: "long" }),
      time: datePart(event.event_date, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
      day: datePart(event.event_date, { day: "2-digit" }),
      month: datePart(event.event_date, { month: "short" }).replace(".", "").toUpperCase(),
      year: datePart(event.event_date, { year: "numeric" }),
    },
    lines: row.order_items.map((item) => ({
      sectorName: item.sector_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      seats: item.seat_labels.map((label) => shortSeat(item.sector_id, label)),
    })),
    slots,
    attendees: [...row.order_attendees]
      .sort((a, b) => a.position - b.position)
      .map((a) => ({
        sectorId: a.sector_id,
        seatLabel: a.seat_label,
        firstName: a.first_name,
        lastName: a.last_name,
        document: a.document,
        birthDate: a.birth_date,
      })),
  };
}
