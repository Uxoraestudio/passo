import { describe, expect, it } from "vitest";
import { buildSeatRows, describeSeat, parseSeatLabel, rowLabel } from "./seatMap";

describe("etiquetas de asientos", () => {
  it("filas A…Z y luego AA…", () => {
    expect([0, 25, 26, 27].map(rowLabel)).toEqual(["A", "Z", "AA", "AB"]);
  });

  it("lee la cuadrícula y las etiquetas del plano", () => {
    expect(parseSeatLabel("A12")).toEqual({ row: "A", number: 12 });
    expect(parseSeatLabel("PB-A12")).toEqual({ row: "A", number: 12 });
    expect(parseSeatLabel("1-12")).toEqual({ row: "1", number: 12 });
    expect(parseSeatLabel("PB-1-12")).toEqual({ row: "1", number: 12 });
    // Prefijo sin guion: ambiguo, mejor no adivinar
    expect(parseSeatLabel("PIH7")).toBeNull();
  });

  it("usa la fila y el número del plano cuando los tiene", () => {
    expect(describeSeat("PIH7", "H", 7)).toBe("Fila H · Asiento 7");
    expect(describeSeat("A12")).toBe("Fila A · Asiento 12");
    expect(describeSeat("PIH7")).toBe("Asiento PIH7");
  });

  it("la cuadrícula marca ocupados y respeta la capacidad", () => {
    const rows = buildSeatRows(7, 3, new Set(["A2"]));
    expect(rows.map((r) => r.length)).toEqual([3, 3, 1]);
    expect(rows[0][1]).toMatchObject({ id: "A2", status: "occupied" });
  });
});
