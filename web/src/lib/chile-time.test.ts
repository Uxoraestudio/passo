import { describe, expect, it } from "vitest";
import { chileParts, chileToday } from "./chile-time";
import { formatDay, formatMonth } from "./events";
import { defaultEventDetail } from "./eventDetails";

// Run with TZ=UTC (like Vercel) and TZ=America/Santiago: results must not change.
describe("fechas en hora de Chile", () => {
  it("un evento a las 21:00 del 11 de diciembre no pasa al 12 en un servidor UTC", () => {
    const iso = "2026-12-12T00:00:00+00:00"; // 11 dic 21:00 en Chile (horario de verano, UTC-3)
    expect(chileParts(iso)).toEqual({ year: 2026, month: 11, day: 11, weekday: 5, hour: 21, minute: 0 });
    expect([formatDay(iso), formatMonth(iso)]).toEqual(["11", "DIC"]);
  });

  it("la página del evento muestra día, fecha y hora de Chile", () => {
    const d = defaultEventDetail({
      event_date: "2026-12-12T00:00:00+00:00",
      status: "en-venta",
      capacity: 100,
      sold: 0,
      price_base: 10000,
      subtitle: null,
      description: null,
    } as Parameters<typeof defaultEventDetail>[0]);
    expect([d.dateSub, d.dateLabel, d.doorsOpen]).toEqual(["Viernes", "11 Diciembre 2026", "21:00 hrs"]);
  });

  it("en invierno (UTC-4) también", () => {
    expect(chileParts("2026-07-01T01:30:00Z")).toMatchObject({ month: 5, day: 30, hour: 21, minute: 30 });
  });

  it("medianoche en Chile es la hora 0, no la 24", () => {
    expect(chileParts("2026-12-12T03:00:00Z").hour).toBe(0);
  });

  it("hoy en Chile para los campos de fecha", () => {
    expect(chileToday(Date.parse("2026-12-12T02:00:00Z"))).toBe("2026-12-11");
  });
});
