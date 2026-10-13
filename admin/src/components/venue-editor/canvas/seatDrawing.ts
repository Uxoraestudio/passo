// Drawing thousands of seats on a canvas (Fase 6: 20,000 seats must stay fluid).
//
// Two savings, both invisible to the eye:
//   * culling: seats outside the visible part of the canvas are skipped, so a
//     zoomed-in view only pays for what it shows;
//   * level of detail: when a seat is under ~2 device pixels wide (zoomed far
//     out) it is drawn as a filled square, without border or marks.

export type SeatDot = { x: number; y: number };

export type DotStyle = {
  fill: string;
  stroke?: string;
  lineWidth?: number;
  dash?: number[];
  /** Diagonal mark (blocked seat). */
  slash?: string;
};

/** Below this radius in device pixels a seat is drawn as a plain square. */
const LOD_RADIUS = 2;

/** Visible area in world coordinates, from the context's current transform (no rotation). */
export function visibleArea(c: CanvasRenderingContext2D, pad: number) {
  const m = c.getTransform();
  const scale = m.a || 1;
  return {
    scale,
    minX: -m.e / scale - pad,
    minY: -m.f / scale - pad,
    maxX: (c.canvas.width - m.e) / scale + pad,
    maxY: (c.canvas.height - m.f) / scale + pad,
  };
}

/**
 * Draws seats at world coordinates (`at` maps a seat to them). `styleOf`
 * returns the look of each seat; it is only called for visible seats.
 */
export function drawSeats<T>(c: CanvasRenderingContext2D, seats: readonly T[], at: (seat: T) => SeatDot, radius: number, styleOf: (seat: T) => DotStyle) {
  const area = visibleArea(c, radius * 2);
  const simple = radius * area.scale < LOD_RADIUS;
  const side = radius * 2;
  for (const seat of seats) {
    const { x, y } = at(seat);
    if (x < area.minX || x > area.maxX || y < area.minY || y > area.maxY) continue;
    const style = styleOf(seat);
    if (simple) {
      // White seats rely on their border; at this size the border colour is the seat.
      c.fillStyle = style.fill === "#ffffff" && style.stroke ? style.stroke : style.fill;
      c.fillRect(x - radius, y - radius, side, side);
      continue;
    }
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fillStyle = style.fill;
    c.fill();
    if (style.stroke) {
      c.lineWidth = style.lineWidth ?? radius * 0.28;
      c.strokeStyle = style.stroke;
      c.setLineDash(style.dash ?? []);
      c.stroke();
      if (style.dash) c.setLineDash([]);
    }
    if (style.slash) {
      c.strokeStyle = style.slash;
      c.lineWidth = radius * 0.35;
      c.beginPath();
      c.moveTo(x - radius * 0.55, y - radius * 0.55);
      c.lineTo(x + radius * 0.55, y + radius * 0.55);
      c.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Bitmap cache
// ---------------------------------------------------------------------------
// Panning or zooming a fully visible plan would redraw every seat each frame.
// Instead each block of seats is kept as a bitmap at the current zoom: moving
// the plan only moves bitmaps, and the seats are redrawn once when the zoom
// settles. Very zoomed in, the bitmap would be huge, so the cache is dropped
// and culling keeps the live drawing cheap.

/** Largest cached bitmap side, in device pixels. */
const CACHE_MAX_PX = 4096;

export type SeatBounds = { minX: number; minY: number; maxX: number; maxY: number };

export function seatBounds(dots: readonly SeatDot[], radius: number): SeatBounds | null {
  if (dots.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { x, y } of dots) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const pad = radius * 2 + 2;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

type Cacheable = {
  clearCache: () => unknown;
  cache: (config: { x: number; y: number; width: number; height: number; pixelRatio: number }) => unknown;
  getLayer: () => { batchDraw: () => unknown } | null;
};

/** Caches a seats shape as a bitmap sharp at `scale` (stage zoom), or drops the cache when too big. */
export function cacheSeats(node: Cacheable | null, bounds: SeatBounds | null, scale: number) {
  if (!node) return;
  node.clearCache();
  if (bounds) {
    const pixelRatio = scale * (typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    if (width * pixelRatio <= CACHE_MAX_PX && height * pixelRatio <= CACHE_MAX_PX) {
      node.cache({ x: bounds.minX, y: bounds.minY, width, height, pixelRatio });
    }
  }
  node.getLayer()?.batchDraw();
}
