import type { Point, Row, Seat } from "@/lib/venue-map-types";
import { centroid, clamp01, pointInPolygon, type Size, type Vec } from "./geometry";

// Parametric seat generator. Pure functions: no React, no I/O.
//
// Layout in local coordinates (world pixels before rotation):
//   - rows run along x; row 0 is the front row (closest to the stage) at y = 0
//   - further rows go towards +y, rowSpacing apart
//   - rotation 0 means the front faces "up" (towards smaller y on the plan)
// The whole block is then rotated and its centre placed on `center`.
// Seat 1 is on the left as seen from the audience (looking at the stage).

export type RowLabelStyle = "letters" | "numbers";
export type RowOrder = "front-to-back" | "back-to-front";
export type SeatNumbering = "ltr" | "rtl" | "odd-even-center";
export type Alignment = "center" | "left" | "right";

export type GeneratorParams = {
  rows: number;
  seatsPerRow: number;
  /** Optional per-row override; empty entries fall back to seatsPerRow. */
  seatsPerRowList: number[] | null;
  /** World pixels between seat centres in a row. */
  seatSpacing: number;
  /** World pixels between rows. */
  rowSpacing: number;
  curved: boolean;
  /** World pixels from the arc centre to the front row (curved only). */
  arcRadius: number;
  /** Degrees, clockwise. */
  rotation: number;
  /** Seat numbers (1-based, in physical order) after which an aisle opens. */
  aisles: number[];
  /** Aisle width, in seat spacings. */
  aisleWidth: number;
  alignment: Alignment;
  /** Block centre, normalised. Null = centre of the section. */
  center: Point | null;
  rowLabels: RowLabelStyle;
  /** First row label: "A" for letters, a number for numbers. */
  rowStart: string;
  rowOrder: RowOrder;
  numbering: SeatNumbering;
  seatStart: number;
  /** Drop seats that fall outside the section polygon. */
  clip: boolean;
};

export type GeneratorResult = {
  rows: Row[];
  seats: Seat[];
  /** Seats removed because they fell outside the section (or the image). */
  clipped: number;
  /** Labels that appear more than once. */
  duplicates: string[];
};

export const GENERATOR_LIMITS = { rows: 200, seatsPerRow: 300, seats: 30000 };

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

/** 0 → A … 25 → Z, 26 → AA, 27 → AB … */
export function letterLabel(index: number): string {
  let n = index;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export function letterIndex(label: string): number {
  return label
    .toUpperCase()
    .split("")
    .reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
}

export function rowLabelFor(index: number, style: RowLabelStyle, start: string): string {
  if (style === "numbers") {
    const first = Number.parseInt(start, 10);
    return String((Number.isFinite(first) ? first : 1) + index);
  }
  const base = /^[A-Za-z]{1,2}$/.test(start) ? letterIndex(start) : 0;
  return letterLabel(base + index);
}

export function seatLabel(prefix: string, rowLabel: string, number: number, style: RowLabelStyle): string {
  // Numeric rows need a separator: row 1 seat 12 must not read as row 11 seat 2.
  return `${prefix}${rowLabel}${style === "numbers" ? "-" : ""}${number}`;
}

/** Seat numbers for `count` seats ordered left → right (audience view). */
export function seatNumbers(count: number, numbering: SeatNumbering, start: number): number[] {
  if (numbering === "ltr") return Array.from({ length: count }, (_, i) => start + i);
  if (numbering === "rtl") return Array.from({ length: count }, (_, i) => start + count - 1 - i);
  // From the centre outwards: odd numbers to the left, even to the right.
  const result = new Array<number>(count);
  const mid = (count - 1) / 2;
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < count; i++) (i <= mid ? left : right).push(i);
  left.reverse(); // closest to the centre first
  left.forEach((pos, k) => (result[pos] = start + 2 * k));
  right.forEach((pos, k) => (result[pos] = start + 1 + 2 * k));
  return result;
}

export function findDuplicateLabels(seats: { label: string }[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const s of seats) (seen.has(s.label) ? dup : seen).add(s.label);
  return [...dup];
}

// ---------------------------------------------------------------------------
// Geometry of the block
// ---------------------------------------------------------------------------

function rowOffsets(count: number, spacing: number, aisles: Set<number>, aisleWidth: number): number[] {
  const offsets: number[] = [];
  let x = 0;
  for (let i = 1; i <= count; i++) {
    offsets.push(x);
    x += spacing + (aisles.has(i) && i < count ? aisleWidth * spacing : 0);
  }
  return offsets;
}

const rotate = (p: Vec, deg: number): Vec => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
};

/** Rotation (degrees) that makes the front of a block at `from` face `to`. */
export function rotationTowards(from: Point, to: Point, size: Size): number {
  const dx = (to[0] - from[0]) * size.width;
  const dy = (to[1] - from[1]) * size.height;
  if (dx === 0 && dy === 0) return 0;
  const deg = Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI) * 10) / 10;
  return ((deg % 360) + 360) % 360;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export function generateSeats(params: GeneratorParams, polygon: Point[], size: Size, prefix: string): GeneratorResult {
  const rows = Math.max(1, Math.min(GENERATOR_LIMITS.rows, Math.floor(params.rows)));
  const counts = Array.from({ length: rows }, (_, r) =>
    Math.max(0, Math.min(GENERATOR_LIMITS.seatsPerRow, Math.floor(params.seatsPerRowList?.[r] || params.seatsPerRow)))
  );
  const aisles = new Set(params.aisles.filter((n) => Number.isInteger(n) && n > 0));
  const spacing = Math.max(0.1, params.seatSpacing);
  const rowSpacing = Math.max(0.1, params.rowSpacing);

  // 1. Local positions, row by row.
  const offsets = counts.map((n) => rowOffsets(n, spacing, aisles, params.aisleWidth));
  const widths = offsets.map((o) => (o.length ? o[o.length - 1] : 0));
  const maxWidth = Math.max(0, ...widths);
  const local: { row: number; pos: Vec[] }[] = offsets.map((o, r) => {
    const shift = params.alignment === "left" ? -maxWidth / 2 : params.alignment === "right" ? maxWidth / 2 - widths[r] : -widths[r] / 2;
    const y = r * rowSpacing;
    return {
      row: r,
      pos: o.map((x) => {
        const lx = x + shift;
        if (!params.curved || params.arcRadius <= 0) return { x: lx, y };
        // Concentric arcs whose centre sits in front of the block (towards the stage).
        const radius = params.arcRadius + y;
        const angle = lx / radius;
        return { x: radius * Math.sin(angle), y: -params.arcRadius + radius * Math.cos(angle) };
      }),
    };
  });

  // 2. Centre the block on `center` after rotating it.
  const all = local.flatMap((r) => r.pos);
  const minX = Math.min(...all.map((p) => p.x));
  const maxX = Math.max(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxY = Math.max(...all.map((p) => p.y));
  const mid = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const [cx, cy] = params.center ?? centroid(polygon);
  const target = { x: cx * size.width, y: cy * size.height };

  const toNormalised = (p: Vec): Point => {
    const r = rotate({ x: p.x - mid.x, y: p.y - mid.y }, params.rotation);
    return [(target.x + r.x) / size.width, (target.y + r.y) / size.height];
  };

  // 3. Clip, then number the seats that remain in each row.
  const rowsOut: Row[] = [];
  const seats: Seat[] = [];
  let clipped = 0;
  for (const { row, pos } of local) {
    const labelIndex = params.rowOrder === "front-to-back" ? row : rows - 1 - row;
    const rowLabel = rowLabelFor(labelIndex, params.rowLabels, params.rowStart);
    const kept: Point[] = [];
    for (const p of pos) {
      const n = toNormalised(p);
      const inside = n[0] >= 0 && n[0] <= 1 && n[1] >= 0 && n[1] <= 1 && (!params.clip || pointInPolygon(n, polygon));
      if (inside) kept.push(n);
      else clipped++;
    }
    if (kept.length === 0) continue;
    rowsOut.push({ label: rowLabel });
    const numbers = seatNumbers(kept.length, params.numbering, params.seatStart);
    kept.forEach(([x, y], i) => {
      seats.push({
        rowLabel,
        label: seatLabel(prefix, rowLabel, numbers[i], params.rowLabels),
        number: numbers[i],
        x: clamp01(x),
        y: clamp01(y),
        kind: "NORMAL",
        baseStatus: "AVAILABLE",
        manual: false,
      });
    });
  }

  return { rows: rowsOut, seats, clipped, duplicates: findDuplicateLabels(seats) };
}

/**
 * Applies a generation to a section that may hold hand-edited seats: manual
 * seats always survive; generated seats that reuse a manual label or sit on top
 * of a manual seat are dropped and reported.
 */
export function mergeWithManual(
  existing: Seat[],
  existingRows: Row[],
  generated: GeneratorResult,
  minDistancePx: number,
  size: Size
): { rows: Row[]; seats: Seat[]; dropped: number } {
  const manual = existing.filter((s) => s.manual);
  const manualLabels = new Set(manual.map((s) => s.label));
  const tooClose = (s: Seat) =>
    manual.some((m) => Math.hypot((m.x - s.x) * size.width, (m.y - s.y) * size.height) < minDistancePx);
  const kept = generated.seats.filter((s) => !manualLabels.has(s.label) && !tooClose(s));
  const rowLabels = new Set(generated.rows.map((r) => r.label));
  const extraRows = existingRows.filter((r) => !rowLabels.has(r.label) && manual.some((m) => m.rowLabel === r.label));
  return { rows: [...generated.rows, ...extraRows], seats: [...manual, ...kept], dropped: generated.seats.length - kept.length };
}

/** Radius (world px) at which seats are drawn: 0,24 m once calibrated, a fraction of the plan otherwise. */
export function seatRadiusPx(size: Size, scaleMPerPx: number | null) {
  return scaleMPerPx ? 0.24 / scaleMPerPx : Math.max(2.5, Math.min(size.width, size.height) / 320);
}

/**
 * Sensible starting parameters. The block faces `target` (the stage, or the
 * centre of the plan when there is no stage element), and rows/seats are sized
 * along the section's own axes once rotated, never closer than the drawn seat.
 */
export function defaultParams(polygon: Point[], size: Size, scaleMPerPx: number | null, target: Point | null): GeneratorParams {
  const center = centroid(polygon);
  const facing = target ?? [0.5, 0.5];
  const rotation = rotationTowards(center, facing, size);
  // Extent of the section in the block's frame: x along the rows, y from front to back.
  const a = (rotation * Math.PI) / 180;
  const ux = { x: Math.cos(a), y: Math.sin(a) };
  const uy = { x: -Math.sin(a), y: Math.cos(a) };
  const along = polygon.map(([x, y]) => x * size.width * ux.x + y * size.height * ux.y);
  const depth = polygon.map(([x, y]) => x * size.width * uy.x + y * size.height * uy.y);
  const w = Math.max(...along) - Math.min(...along);
  const h = Math.max(...depth) - Math.min(...depth);
  const r = seatRadiusPx(size, scaleMPerPx);
  const seatSpacing = scaleMPerPx ? 0.5 / scaleMPerPx : Math.max(r * 2.6, w / 21);
  const rowSpacing = scaleMPerPx ? 0.9 / scaleMPerPx : Math.max(r * 3, h / 11);
  return {
    rows: Math.max(1, Math.min(GENERATOR_LIMITS.rows, Math.floor((h * 0.9) / rowSpacing))),
    seatsPerRow: Math.max(1, Math.min(GENERATOR_LIMITS.seatsPerRow, Math.floor((w * 0.9) / seatSpacing))),
    seatsPerRowList: null,
    seatSpacing,
    rowSpacing,
    curved: false,
    arcRadius: Math.max(w, h) * 1.5,
    rotation,
    aisles: [],
    aisleWidth: 1,
    alignment: "center",
    center: null,
    rowLabels: "letters",
    rowStart: "A",
    rowOrder: "front-to-back",
    numbering: "ltr",
    seatStart: 1,
    clip: true,
  };
}
