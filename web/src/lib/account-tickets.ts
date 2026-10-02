import { pickImage, type EventRow } from "@/lib/events";
import { defaultEventDetail, eventDetails } from "@/lib/eventDetails";

export type TicketStatus = "confirmada" | "usada" | "cancelada";

export type AccountTicket = {
  id: string;
  orderCode: string;
  status: TicketStatus;
  quantity: number;
  sector: string;
  seats: string | null;
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

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

// Demo tickets derived from real published events until purchases are persisted.
export function buildDemoTickets(rows: EventRow[], now = Date.now()): AccountTicket[] {
  return rows.slice(0, 5).map((row, index) => {
    const detail = eventDetails[row.id] ?? defaultEventDetail(row);
    const seed = hash(row.id);
    const tier = detail.tiers[seed % detail.tiers.length];
    const quantity = index === 0 ? 2 : (seed % 2) + 1;
    const isPast = new Date(row.event_date).getTime() < now || row.status === "finalizado";
    const rowLetter = String.fromCharCode(65 + (seed % 12));
    const firstSeat = 4 + (seed % 20);
    const seats = tier.numbered
      ? `Fila ${rowLetter} · ${quantity > 1 ? `Asientos ${firstSeat} y ${firstSeat + 1}` : `Asiento ${firstSeat}`}`
      : null;

    return {
      id: `${row.id}-demo`,
      orderCode: `PS-${String(seed).slice(0, 6).padStart(6, "0")}`,
      status: isPast ? "usada" : "confirmada",
      quantity,
      sector: tier.name,
      seats,
      event: {
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle ?? "",
        image: pickImage(row.image_url, row.banner_image_url),
        venue: row.venue,
        city: row.city,
        dateLong: formatTicketDate(row.event_date),
        time: formatTicketTime(row.event_date),
        ...formatDayMonth(row.event_date),
        daysLeft: daysUntil(row.event_date, now),
      },
    };
  });
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
