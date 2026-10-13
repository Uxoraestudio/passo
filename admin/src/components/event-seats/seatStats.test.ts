import { describe, expect, it } from "vitest";
import type { EventSeat, EventSeatSector, PriceZone } from "@/lib/event-seats-data";
import { countSeats, describeSeat, seatName, seatPrice } from "./seatStats";

const seat = (over: Partial<EventSeat>): EventSeat => ({
  id: "s",
  sectorId: "sec",
  rowLabel: "A",
  label: "PA1",
  number: 1,
  x: 0.5,
  y: 0.5,
  kind: "NORMAL",
  state: "AVAILABLE",
  zoneId: null,
  blockReason: null,
  ...over,
});

const sector = { id: "sec", name: "Platea", price: 20000 } as EventSeatSector;
const zones = new Map<string, PriceZone>([["vip", { id: "vip", name: "VIP", color: "#e11d48", price: 35000 }]]);

describe("asientos del evento", () => {
  it("cuenta por estado y accesibles", () => {
    const counts = countSeats([
      seat({}),
      seat({ state: "SOLD" }),
      seat({ state: "HELD" }),
      seat({ state: "BLOCKED", kind: "ACCESSIBLE" }),
    ]);
    expect(counts).toEqual({ total: 4, available: 1, sold: 1, held: 1, blocked: 1, accessible: 1 });
  });

  it("el precio es el de su zona o, sin zona, el del sector", () => {
    expect(seatPrice(seat({ zoneId: "vip" }), sector, zones)).toBe(35000);
    expect(seatPrice(seat({}), sector, zones)).toBe(20000);
    expect(seatPrice(seat({ zoneId: "borrada" }), sector, zones)).toBe(20000);
  });

  it("describe el asiento para el tooltip", () => {
    expect(seatName(seat({}))).toBe("Fila A · Asiento 1");
    expect(seatName(seat({ rowLabel: null, number: null }))).toBe("Asiento PA1");
    expect(describeSeat(seat({ zoneId: "vip", kind: "ACCESSIBLE" }), sector, zones)).toBe("Platea · Fila A · Asiento 1 · VIP $35.000 · Disponible · Accesible");
  });
});
