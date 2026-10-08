import type { Point } from "@/lib/venue-map-types";

// The editor works in "world" coordinates = pixels of the plan image, and
// stores normalised coordinates (0–1). These helpers convert between both.

export type Size = { width: number; height: number };
export type Vec = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const clamp01 = (v: number) => clamp(v, 0, 1);

export const toWorld = ([x, y]: Point, size: Size): Vec => ({ x: x * size.width, y: y * size.height });
export const toNorm = (p: Vec, size: Size): Point => [clamp01(p.x / size.width), clamp01(p.y / size.height)];

export const snapValue = (v: number, step: number) => (step > 0 ? Math.round(v / step) * step : v);
export const snapVec = (p: Vec, step: number | null): Vec => (step ? { x: snapValue(p.x, step), y: snapValue(p.y, step) } : p);

export const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

/** Flat [x1, y1, x2, y2, ...] list in world coordinates, as Konva lines expect. */
export const flatWorld = (points: Point[], size: Size) => points.flatMap(([x, y]) => [x * size.width, y * size.height]);

/** Area-weighted centroid; falls back to the vertex average for degenerate polygons. */
export function centroid(points: Point[]): Point {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  if (Math.abs(area) < 1e-12) {
    const n = points.length || 1;
    return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
  }
  return [cx / (3 * area), cy / (3 * area)];
}

export function bounds(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  return points.reduce(
    (b, [x, y]) => ({ minX: Math.min(b.minX, x), minY: Math.min(b.minY, y), maxX: Math.max(b.maxX, x), maxY: Math.max(b.maxY, y) }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
}

/** Ray casting; points on the edge may fall either way. */
export function pointInPolygon([px, py]: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function rectsIntersect(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/** Normalised rectangle from two corners in any order. */
export function rectFromCorners(a: Vec, b: Vec): Rect {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
}

/** Index of the edge (i → i+1) closest to `p`, and the projected point on it. */
export function nearestEdge(points: Vec[], p: Vec): { index: number; point: Vec; dist: number } {
  let best = { index: 0, point: points[0], dist: Infinity };
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / len2, 0, 1);
    const q = { x: a.x + t * dx, y: a.y + t * dy };
    const d = distance(p, q);
    if (d < best.dist) best = { index: i, point: q, dist: d };
  }
  return best;
}

/** Applies a 2D affine matrix [a, b, c, d, e, f] (Konva/Canvas order) to a world point. */
export function applyMatrix(m: number[], p: Vec): Vec {
  return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] };
}

/** Meters per image pixel from two normalised points and their real distance. */
export function scaleFromCalibration(a: Point, b: Point, meters: number, size: Size): number | null {
  const px = distance(toWorld(a, size), toWorld(b, size));
  return px > 0 && meters > 0 ? meters / px : null;
}
