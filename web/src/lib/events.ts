import type { Slide } from "@/components/Hero";

export type EventCardData = {
  id: string;
  slug?: string;
  image: string;
  alt: string;
  day: string;
  month: string;
  title: string;
  subtitle: string;
  venue: string;
  city: string;
  price: string;
  category: string | null;
  tags: { label: string; variant: "primary" | "secondary" | "orange" }[];
};

export type EventStatus = "borrador" | "en-venta" | "casi-agotado" | "proximamente" | "finalizado";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  venue: string;
  city: string;
  event_date: string;
  category: string | null;
  image_url: string | null;
  hero_image_url: string | null;
  banner_image_url: string | null;
  price_base: number;
  capacity: number;
  sold: number;
  status: EventStatus;
  show_in_hero: boolean;
  max_tickets_per_order?: number | null;
  sale_start?: string | null;
};

export const FALLBACK_IMAGE = "/images/banner-crowd.jpg";
const MONTHS_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export function pickImage(...urls: (string | null | undefined)[]): string {
  return urls.find((url) => url) || FALLBACK_IMAGE;
}

export function formatPrice(priceBase: number): string {
  return `$ ${priceBase.toLocaleString("es-CL")}`;
}

export function formatDay(isoDate: string): string {
  const date = new Date(isoDate);
  return String(date.getDate()).padStart(2, "0");
}

export function formatMonth(isoDate: string): string {
  const date = new Date(isoDate);
  return MONTHS_SHORT[date.getMonth()];
}

function statusTag(status: EventStatus): EventCardData["tags"] {
  if (status === "casi-agotado") return [{ label: "CASI AGOTADO", variant: "orange" }];
  if (status === "proximamente") return [{ label: "PRÓXIMAMENTE", variant: "secondary" }];
  if (status === "finalizado") return [{ label: "FINALIZADO", variant: "secondary" }];
  return [];
}

function statusEyebrow(status: EventStatus): string {
  if (status === "casi-agotado") return "Últimas entradas";
  if (status === "proximamente") return "Próximamente";
  if (status === "finalizado") return "Evento finalizado";
  return "Entradas disponibles";
}

export function toEventCardData(row: EventRow): EventCardData {
  return {
    id: row.id,
    slug: row.slug,
    image: pickImage(row.image_url),
    alt: row.title,
    day: formatDay(row.event_date),
    month: formatMonth(row.event_date),
    title: row.title,
    subtitle: row.subtitle ?? "",
    venue: row.venue,
    city: row.city,
    price: formatPrice(row.price_base),
    category: row.category ?? null,
    tags: statusTag(row.status),
  };
}

export function toHeroSlide(row: EventRow): Slide {
  return {
    id: row.id,
    slug: row.slug,
    image: pickImage(row.hero_image_url, row.image_url),
    alt: row.title,
    eyebrow: statusEyebrow(row.status),
    title: row.title,
    subtitle: row.subtitle ?? "",
    date: `${formatDay(row.event_date)} ${formatMonth(row.event_date)}`,
    venue: `${row.venue}, ${row.city}`,
    price: `Desde ${formatPrice(row.price_base)}`,
  };
}

export const cities = ["Santiago", "Viña del Mar", "Valparaíso", "Concepción", "Antofagasta"];

export function eventHref(event: EventCardData): string {
  return event.slug ? `/eventos/${event.slug}` : "/eventos";
}

export function searchEvents(query: string, source: EventCardData[]): EventCardData[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return source.filter((event) => {
    const haystack = [
      event.title,
      event.subtitle,
      event.venue,
      event.city,
      ...event.tags.map((tag) => tag.label),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
