import { describe, expect, it } from "vitest";
import { cacheSeats, drawSeats, seatBounds, visibleArea } from "./seatDrawing";

/** Minimal 2D context that records what gets drawn. */
function fakeContext(transform: { a: number; e: number; f: number }, width = 800, height = 600) {
  const calls = { arcs: 0, rects: 0, fills: [] as string[] };
  const ctx = {
    canvas: { width, height },
    getTransform: () => ({ a: transform.a, e: transform.e, f: transform.f }),
    beginPath() {},
    arc() {
      calls.arcs++;
    },
    fill() {
      calls.fills.push(ctx.fillStyle);
    },
    fillRect() {
      calls.rects++;
      calls.fills.push(ctx.fillStyle);
    },
    stroke() {},
    moveTo() {},
    lineTo() {},
    setLineDash() {},
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

// 100 × 100 seats, 10 px apart: a 1000 × 1000 world.
const seats = Array.from({ length: 10000 }, (_, i) => ({ x: (i % 100) * 10 + 5, y: Math.floor(i / 100) * 10 + 5 }));
const at = (s: { x: number; y: number }) => s;

describe("dibujo de asientos", () => {
  it("calcula el área visible desde la transformación", () => {
    const { ctx } = fakeContext({ a: 2, e: -100, f: -50 });
    expect(visibleArea(ctx, 0)).toEqual({ scale: 2, minX: 50, minY: 25, maxX: 450, maxY: 325 });
  });

  it("con zoom solo dibuja los asientos visibles", () => {
    const { ctx, calls } = fakeContext({ a: 4, e: 0, f: 0 }); // ve 200 × 150 del mundo
    drawSeats(ctx, seats, at, 3, () => ({ fill: "#6534f5" }));
    expect(calls.arcs).toBeGreaterThan(0);
    expect(calls.arcs).toBeLessThan(500);
  });

  it("muy alejado dibuja cuadrados simples en vez de círculos", () => {
    const { ctx, calls } = fakeContext({ a: 0.5, e: 0, f: 0 }); // radio 3 → 1,5 px
    drawSeats(ctx, seats, at, 3, () => ({ fill: "#6534f5" }));
    expect(calls.arcs).toBe(0);
    expect(calls.rects).toBe(10000);
  });

  it("en modo simple, un asiento blanco toma el color de su borde", () => {
    const { ctx, calls } = fakeContext({ a: 0.5, e: 0, f: 0 });
    drawSeats(ctx, seats.slice(0, 1), at, 3, () => ({ fill: "#ffffff", stroke: "#e11d48" }));
    expect(calls.fills).toEqual(["#e11d48"]);
  });

  it("los límites incluyen el radio de los asientos", () => {
    expect(seatBounds([{ x: 10, y: 20 }, { x: 30, y: 5 }], 2)).toEqual({ minX: 4, minY: -1, maxX: 36, maxY: 26 });
    expect(seatBounds([], 2)).toBeNull();
  });

  it("la imagen en caché se descarta cuando sería demasiado grande", () => {
    const log: string[] = [];
    const node = {
      clearCache: () => log.push("clear"),
      cache: (c: { pixelRatio: number }) => log.push(`cache@${c.pixelRatio}`),
      getLayer: () => ({ batchDraw: () => log.push("draw") }),
    };
    const bounds = { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    cacheSeats(node, bounds, 1);
    expect(log).toEqual(["clear", "cache@1", "draw"]);
    log.length = 0;
    cacheSeats(node, bounds, 10); // 10.000 px de lado: sin caché, se dibuja en vivo
    expect(log).toEqual(["clear", "draw"]);
  });
});
