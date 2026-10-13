import type { CSSProperties } from "react";
import type { EventSeat, EventSeatSector, PriceZone } from "@/lib/event-seats-data";

export type SeatCounts = { total: number; available: number; sold: number; held: number; blocked: number; accessible: number };

export const emptyCounts = (): SeatCounts => ({ total: 0, available: 0, sold: 0, held: 0, blocked: 0, accessible: 0 });

export function addSeat(counts: SeatCounts, seat: EventSeat) {
  counts.total++;
  if (seat.state === "AVAILABLE") counts.available++;
  else if (seat.state === "SOLD") counts.sold++;
  else if (seat.state === "HELD") counts.held++;
  else counts.blocked++;
  if (seat.kind === "ACCESSIBLE") counts.accessible++;
  return counts;
}

export function countSeats(seats: EventSeat[]): SeatCounts {
  return seats.reduce(addSeat, emptyCounts());
}

export const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;

/** What the buyer pays for the seat: its zone's price, or the sector's. */
export function seatPrice(seat: EventSeat, sector: EventSeatSector | undefined, zones: Map<string, PriceZone>) {
  const zone = seat.zoneId ? zones.get(seat.zoneId) : undefined;
  return zone?.price ?? sector?.price ?? 0;
}

const stateText: Record<EventSeat["state"], string> = {
  AVAILABLE: "Disponible",
  HELD: "Reservado (en pago)",
  SOLD: "Vendido",
  BLOCKED: "Bloqueado",
};

export function seatName(seat: EventSeat) {
  return seat.rowLabel && seat.number != null ? `Fila ${seat.rowLabel} · Asiento ${seat.number}` : `Asiento ${seat.label}`;
}

export function describeSeat(seat: EventSeat, sector: EventSeatSector | undefined, zones: Map<string, PriceZone>) {
  const zone = seat.zoneId ? zones.get(seat.zoneId) : undefined;
  const price = seatPrice(seat, sector, zones);
  const extra = seat.kind === "ACCESSIBLE" ? " · Accesible" : seat.kind === "OBSTRUCTED" ? " · Visión reducida" : "";
  return `${sector?.name ?? ""} · ${seatName(seat)} · ${zone ? `${zone.name} ` : ""}${currency(price)} · ${stateText[seat.state]}${extra}`;
}

export const SEAT_COLORS = {
  blocked: "#cbd5e1",
  blockedMark: "#475569",
  sold: "#1c1a2a",
  held: "#f59e0b",
  accessible: "#2563eb",
  selection: "#ff782d",
};

const dot = (fill: string, stroke = "transparent"): CSSProperties => ({ ["--dot" as string]: fill, ["--dot-stroke" as string]: stroke });

/** Seat states and kinds as drawn on the canvas; zones are listed separately. */
export const SEAT_LEGEND: { label: string; style: CSSProperties; blocked?: boolean }[] = [
  { label: "Precio del sector", style: dot("#ffffff", "#94a3b8") },
  { label: "Vendido", style: dot(SEAT_COLORS.sold) },
  { label: "En pago", style: dot(SEAT_COLORS.held) },
  { label: "Bloqueado", style: dot(SEAT_COLORS.blocked), blocked: true },
  { label: "Accesible", style: dot("#ffffff", SEAT_COLORS.accessible) },
];
