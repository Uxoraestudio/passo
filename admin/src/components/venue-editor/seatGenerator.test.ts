import { describe, expect, it } from "vitest";
import type { Point } from "@/lib/venue-map-types";
import {
  alignToSection,
  defaultParams,
  findDuplicateLabels,
  generateSeats,
  letterIndex,
  letterLabel,
  mergeWithManual,
  rotationTowards,
  rowLabelFor,
  seatNumbers,
} from "./seatGenerator";

const size = { width: 1000, height: 1000 };
const square: Point[] = [
  [0.1, 0.1],
  [0.9, 0.1],
  [0.9, 0.9],
  [0.1, 0.9],
];
const base = { ...defaultParams(square, size, null, null), rows: 3, seatsPerRow: 5, seatSpacing: 20, rowSpacing: 30, center: [0.5, 0.5] as Point };
const byLabel = <T extends { label: string }>(seats: T[], label: string) => seats.find((s) => s.label === label)!;

describe("numeración", () => {
  it("filas con letras A…Z, AA…ZZ, AAA", () => {
    expect([0, 25, 26, 27, 701, 702].map(letterLabel)).toEqual(["A", "Z", "AA", "AB", "ZZ", "AAA"]);
    expect([0, 25, 26, 27, 701].map((i) => letterIndex(letterLabel(i)))).toEqual([0, 25, 26, 27, 701]);
  });

  it("primera fila configurable, con letras o números", () => {
    expect([rowLabelFor(0, "letters", "C"), rowLabelFor(2, "letters", "C")]).toEqual(["C", "E"]);
    expect([rowLabelFor(0, "numbers", "10"), rowLabelFor(3, "numbers", "10")]).toEqual(["10", "13"]);
  });

  it("asientos de izquierda a derecha, al revés, o impares/pares desde el centro", () => {
    expect(seatNumbers(4, "ltr", 1)).toEqual([1, 2, 3, 4]);
    expect(seatNumbers(4, "rtl", 1)).toEqual([4, 3, 2, 1]);
    expect(seatNumbers(5, "odd-even-center", 1)).toEqual([5, 3, 1, 2, 4]);
    expect(seatNumbers(4, "odd-even-center", 1)).toEqual([3, 1, 2, 4]);
  });

  it("filas numéricas usan separador y no generan etiquetas ambiguas (1-11 vs 11-1)", () => {
    const r = generateSeats({ ...base, rowLabels: "numbers", rowStart: "1", rows: 12, seatsPerRow: 12 }, square, size, "");
    expect(r.seats.some((s) => s.label === "1-12")).toBe(true);
    expect(r.duplicates).toEqual([]);
  });

  it("detecta etiquetas duplicadas", () => {
    expect(findDuplicateLabels([{ label: "A1" }, { label: "A2" }, { label: "A1" }])).toEqual(["A1"]);
  });
});

describe("generador de asientos", () => {
  const r1 = generateSeats(base, square, size, "PB-");

  it("3 filas × 5 asientos, con prefijo y sin duplicados", () => {
    expect(r1.seats).toHaveLength(15);
    expect(r1.rows).toHaveLength(3);
    expect(r1.clipped).toBe(0);
    expect([r1.seats[0].label, r1.seats[14].label]).toEqual(["PB-A1", "PB-C5"]);
    expect(r1.duplicates).toEqual([]);
  });

  it("respeta la separación y centra el bloque", () => {
    const xs = r1.seats.filter((s) => s.rowLabel === "A").map((s) => s.x * 1000);
    expect(xs[1] - xs[0]).toBeCloseTo(20);
    const all = r1.seats.map((s) => s.x);
    expect((Math.min(...all) + Math.max(...all)) / 2).toBeCloseTo(0.5);
  });

  it("rotación 0: la fila A está adelante (arriba) y el asiento 1 a la izquierda", () => {
    expect(byLabel(r1.seats, "PB-A1").y).toBeLessThan(byLabel(r1.seats, "PB-C1").y);
    expect(byLabel(r1.seats, "PB-A1").x).toBeLessThan(byLabel(r1.seats, "PB-A5").x);
  });

  it("orden de atrás hacia adelante", () => {
    const back = generateSeats({ ...base, rowOrder: "back-to-front" }, square, size, "");
    expect(byLabel(back.seats, "A1").y).toBeGreaterThan(byLabel(back.seats, "C1").y);
  });

  it("rotación 90: el frente mira a la derecha", () => {
    const rot = generateSeats({ ...base, rotation: 90 }, square, size, "");
    expect(byLabel(rot.seats, "A1").x).toBeGreaterThan(byLabel(rot.seats, "C1").x);
    expect(rotationTowards([0.5, 0.5], [0.5, 0.1], size)).toBe(0);
    expect(rotationTowards([0.5, 0.5], [0.9, 0.5], size)).toBe(90);
  });

  it("pasillo después del asiento 3 suma 2 separaciones", () => {
    const aisle = generateSeats({ ...base, rows: 1, seatsPerRow: 6, aisles: [3], aisleWidth: 2 }, square, size, "");
    const ax = aisle.seats.map((s) => Math.round(s.x * 1000));
    expect(ax[3] - ax[2]).toBe(60);
    expect(ax[1] - ax[0]).toBe(20);
  });

  it("asientos distintos por fila", () => {
    const v = generateSeats({ ...base, seatsPerRowList: [4, 6, 8] }, square, size, "");
    expect(["A", "B", "C"].map((r) => v.seats.filter((s) => s.rowLabel === r).length)).toEqual([4, 6, 8]);
  });

  it("en arco: las puntas se adelantan, simétricas y con separación pareja", () => {
    const curved = generateSeats({ ...base, rows: 2, seatsPerRow: 9, curved: true, arcRadius: 200 }, square, size, "");
    const rowA = curved.seats.filter((s) => s.rowLabel === "A");
    expect(rowA[4].y).toBeGreaterThan(rowA[0].y);
    expect(rowA[4].y).toBeGreaterThan(rowA[8].y);
    expect(rowA[0].y).toBeCloseTo(rowA[8].y, 9);
    const p = rowA.map((s) => ({ x: s.x * 1000, y: s.y * 1000 }));
    expect(Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y)).toBeCloseTo(Math.hypot(p[5].x - p[4].x, p[5].y - p[4].y), 6);
  });

  it("recorta los asientos fuera del sector y renumera desde 1", () => {
    const tri: Point[] = [
      [0.5, 0.2],
      [0.8, 0.8],
      [0.2, 0.8],
    ];
    const big = { ...base, rows: 20, seatsPerRow: 30, seatSpacing: 20, rowSpacing: 30 };
    const clip = generateSeats(big, tri, size, "");
    expect(clip.clipped).toBeGreaterThan(0);
    expect(clip.seats.every((s) => s.y >= 0.2)).toBe(true);
    expect(clip.seats.find((s) => s.rowLabel === clip.rows[0].label)?.number).toBe(1);
    const noClip = generateSeats({ ...big, clip: false }, tri, size, "");
    expect(noClip.clipped).toBe(0);
    expect(noClip.seats).toHaveLength(600);
  });

  it("genera 20.000 asientos sin duplicados en poco tiempo", () => {
    const t0 = performance.now();
    const big = generateSeats({ ...base, rows: 100, seatsPerRow: 200, seatSpacing: 4, rowSpacing: 8 }, [[0, 0], [1, 0], [1, 1], [0, 1]], size, "T-");
    expect(big.seats).toHaveLength(20000);
    expect(big.duplicates).toEqual([]);
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});

describe("asientos editados a mano", () => {
  const r1 = generateSeats(base, square, size, "PB-");
  const regen = generateSeats(base, square, size, "PB-");

  it("se conservan al regenerar y su gemelo generado se descarta", () => {
    const manual = { ...r1.seats[0], kind: "ACCESSIBLE" as const, manual: true };
    const merged = mergeWithManual([manual, ...r1.seats.slice(1)], r1.rows, regen, 5, size);
    expect(merged.seats.filter((s) => s.label === "PB-A1")).toHaveLength(1);
    expect(byLabel(merged.seats, "PB-A1").kind).toBe("ACCESSIBLE");
    expect(merged.dropped).toBe(1);
    expect(merged.seats).toHaveLength(15);
    expect(findDuplicateLabels(merged.seats)).toEqual([]);
  });

  it("un asiento generado encima de uno manual se descarta", () => {
    const moved = { ...r1.seats[1], label: "X1", manual: true };
    const merged = mergeWithManual([moved], [], regen, 5, size);
    expect(merged.dropped).toBe(1);
    expect(merged.seats.some((s) => s.label === "PB-A2")).toBe(false);
  });
});

describe("valores iniciales", () => {
  it("con escala calibrada: asientos cada 0,5 m y filas cada 0,9 m, mirando al escenario", () => {
    const d = defaultParams(square, size, 0.05, [0.5, 0.0]);
    expect(d.seatSpacing).toBeCloseTo(10);
    expect(d.rowSpacing).toBeCloseTo(18);
    expect(d.rotation).toBe(0);
  });

  it("sin escenario, las plateas laterales miran al centro con las filas a lo largo", () => {
    const plan = { width: 730, height: 650 };
    const left: Point[] = [
      [0.05, 0.1],
      [0.12, 0.1],
      [0.12, 0.9],
      [0.05, 0.9],
    ];
    const right: Point[] = [
      [0.88, 0.1],
      [0.95, 0.1],
      [0.95, 0.9],
      [0.88, 0.9],
    ];
    const dl = defaultParams(left, plan, null, null);
    expect(dl.rotation).toBe(90);
    expect(dl.seatsPerRow).toBeGreaterThan(dl.rows);
    const radius = Math.max(2.5, 650 / 320);
    expect(dl.seatSpacing).toBeGreaterThanOrEqual(radius * 2.6 - 1e-9);
    expect(dl.rowSpacing).toBeGreaterThanOrEqual(radius * 3 - 1e-9);
    expect(defaultParams(right, plan, null, null).rotation).toBe(270);
    expect(generateSeats(dl, left, plan, "PI-").seats.length).toBeGreaterThan(0);
  });
});

describe("filas rectas (Club D)", () => {
  const plan = { width: 730, height: 650 };
  // Rectangle with chamfered corners, as drawn in the Club D plan.
  const frontal: Point[] = [
    [0.2, 0.32],
    [0.77, 0.32],
    [0.81, 0.36],
    [0.81, 0.62],
    [0.77, 0.66],
    [0.2, 0.66],
    [0.16, 0.62],
    [0.16, 0.36],
  ];

  it("un sector recto recibe una rotación de 0, 90, 180 o 270°", () => {
    expect([0, 90, 180, 270]).toContain(defaultParams(frontal, plan, null, [0.5, 0.1]).rotation);
  });

  it("todos los asientos de una fila quedan a la misma altura", () => {
    const g = generateSeats(defaultParams(frontal, plan, null, [0.5, 0.1]), frontal, plan, "CF-");
    const ys = g.seats.filter((s) => s.rowLabel === g.seats[0].rowLabel).map((s) => s.y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(1e-9);
  });

  it("endereza los ángulos que quedaban torcidos: 178 → 180, 89,8 → 90, 269,6 → 270", () => {
    expect([178, 89.8, 269.6].map((r) => alignToSection(r, frontal, plan))).toEqual([180, 90, 270]);
  });

  it("un sector en diagonal conserva su propio eje, y un polígono degenerado no cambia", () => {
    const diamond: Point[] = [
      [0.5, 0.1],
      [0.9, 0.5],
      [0.5, 0.9],
      [0.1, 0.5],
    ];
    expect(alignToSection(10, diamond, size) % 45).toBe(0);
    expect(alignToSection(33, [[0.5, 0.5], [0.5, 0.5], [0.5, 0.5]], plan)).toBe(33);
  });
});
