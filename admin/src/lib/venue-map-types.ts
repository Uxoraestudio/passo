// Venue seat map model. Coordinates are normalised to the plan image:
// x and y go from 0 to 1, so the plan scales to any screen size.

export type Point = [x: number, y: number];

export type SectionKind = "SEATED" | "GENERAL_ADMISSION";
export type SeatKind = "NORMAL" | "ACCESSIBLE" | "OBSTRUCTED";
export type SeatBaseStatus = "AVAILABLE" | "BLOCKED";
/** Per-event state: BLOCKED is stored, HELD and SOLD come from live reservations. */
export type SeatState = "AVAILABLE" | "BLOCKED" | "HELD" | "SOLD";
export type MapStatus = "draft" | "published";

export type ElementKind = "STAGE" | "ENTRANCE" | "EXIT" | "BAR" | "BATHROOM" | "TEXT";
export type ElementGeometry =
  | { shape: "rect" | "ellipse"; x: number; y: number; w: number; h: number }
  | { shape: "polygon"; points: Point[] }
  | { shape: "point"; x: number; y: number };

export type MapElement = {
  /** Client-side id for selection and undo; not stored. */
  id: string;
  kind: ElementKind;
  geometry: ElementGeometry;
  /** Degrees, clockwise. */
  rotation: number;
  label: string | null;
  color: string | null;
};

export type Seat = {
  rowLabel: string | null;
  label: string;
  number: number | null;
  x: number;
  y: number;
  kind: SeatKind;
  baseStatus: SeatBaseStatus;
  /** Edited by hand: the generator keeps it when regenerating. */
  manual: boolean;
};

export type Row = { label: string };

export type Section = {
  id: string;
  name: string;
  shortLabel: string | null;
  kind: SectionKind;
  polygon: Point[];
  /** Only for general admission; seated capacity is the number of seats. */
  capacity: number | null;
  color: string;
  labelPoint: Point | null;
  seatPrefix: string;
  /** Seat generator parameters (Fase 3). */
  generator: Record<string, unknown> | null;
  rows: Row[];
  seats: Seat[];
};

export type Calibration = { a: Point; b: Point; meters: number };

export type VenueMap = {
  id: string;
  venueId: string;
  version: number;
  status: MapStatus;
  imagePath: string | null;
  imageWidth: number;
  imageHeight: number;
  /** Meters per image pixel; null until calibrated. */
  scaleMPerPx: number | null;
  calibration: Calibration | null;
  notes: string | null;
  updatedAt: string;
  publishedAt: string | null;
  sections: Section[];
  elements: MapElement[];
};

/** Editable content of a draft (what save_venue_map receives). */
export type VenueMapContent = Pick<VenueMap, "imagePath" | "imageWidth" | "imageHeight" | "scaleMPerPx" | "calibration" | "notes" | "sections" | "elements">;

export type VenueMapSummary = { id: string; version: number; status: MapStatus; updatedAt: string; publishedAt: string | null };

// ---------------------------------------------------------------------------
// Wire format. Seats travel as compact arrays so a 20.000-seat plan stays small:
// [row_label, label, number, x, y, kind, base_status, is_manual]
// ---------------------------------------------------------------------------

export type SeatTuple = [string | null, string, number | null, number, number, SeatKind, SeatBaseStatus, boolean];

type WireSection = {
  id: string;
  name: string;
  short_label: string | null;
  kind: SectionKind;
  polygon: Point[];
  capacity: number | null;
  color: string;
  label_x: number | null;
  label_y: number | null;
  seat_prefix: string;
  generator: Record<string, unknown> | null;
  sort_order: number;
  rows: { label: string; sort_order: number }[];
  seats: SeatTuple[];
};

type WireElement = {
  kind: ElementKind;
  shape: ElementGeometry["shape"];
  geometry: Record<string, unknown>;
  rotation: number;
  label: string | null;
  color: string | null;
  sort_order?: number;
};

export type WireMap = {
  id: string;
  venue_id: string;
  version: number;
  status: MapStatus;
  image_path: string | null;
  image_width: number;
  image_height: number;
  scale_m_per_px: number | string | null;
  calibration: Calibration | null;
  notes: string | null;
  updated_at: string;
  published_at: string | null;
  sections: WireSection[];
  elements: WireElement[];
};

/** 5 decimals ≈ 0,1 px on a 10.000 px plan: precise enough, keeps payloads small. */
export const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

function geometryFromWire(e: WireElement): ElementGeometry {
  const g = e.geometry as Record<string, number> & { points?: Point[] };
  if (e.shape === "polygon") return { shape: "polygon", points: g.points ?? [] };
  if (e.shape === "point") return { shape: "point", x: Number(g.x), y: Number(g.y) };
  return { shape: e.shape, x: Number(g.x), y: Number(g.y), w: Number(g.w), h: Number(g.h) };
}

function geometryToWire(g: ElementGeometry): Record<string, unknown> {
  if (g.shape === "polygon") return { points: g.points.map(([x, y]) => [round5(x), round5(y)]) };
  if (g.shape === "point") return { x: round5(g.x), y: round5(g.y) };
  return { x: round5(g.x), y: round5(g.y), w: round5(g.w), h: round5(g.h) };
}

export function mapFromWire(w: WireMap): VenueMap {
  return {
    id: w.id,
    venueId: w.venue_id,
    version: w.version,
    status: w.status,
    imagePath: w.image_path,
    imageWidth: w.image_width,
    imageHeight: w.image_height,
    scaleMPerPx: w.scale_m_per_px == null ? null : Number(w.scale_m_per_px),
    calibration: w.calibration,
    notes: w.notes,
    updatedAt: w.updated_at,
    publishedAt: w.published_at,
    sections: w.sections.map((s) => ({
      id: s.id,
      name: s.name,
      shortLabel: s.short_label,
      kind: s.kind,
      polygon: s.polygon,
      capacity: s.capacity,
      color: s.color,
      labelPoint: s.label_x != null && s.label_y != null ? [Number(s.label_x), Number(s.label_y)] : null,
      seatPrefix: s.seat_prefix,
      generator: s.generator,
      rows: s.rows.map((r) => ({ label: r.label })),
      seats: s.seats.map(([rowLabel, label, number, x, y, kind, baseStatus, manual]) => ({
        rowLabel,
        label,
        number,
        x: Number(x),
        y: Number(y),
        kind,
        baseStatus,
        manual,
      })),
    })),
    elements: w.elements.map((e) => ({
      id: crypto.randomUUID(),
      kind: e.kind,
      geometry: geometryFromWire(e),
      rotation: Number(e.rotation),
      label: e.label,
      color: e.color,
    })),
  };
}

export function contentToWire(c: VenueMapContent) {
  return {
    image_path: c.imagePath,
    image_width: c.imageWidth,
    image_height: c.imageHeight,
    scale_m_per_px: c.scaleMPerPx,
    calibration: c.calibration,
    notes: c.notes,
    sections: c.sections.map((s, i) => ({
      id: s.id,
      name: s.name.trim(),
      short_label: s.shortLabel?.trim() || null,
      kind: s.kind,
      polygon: s.polygon.map(([x, y]) => [round5(x), round5(y)]),
      capacity: s.kind === "GENERAL_ADMISSION" ? s.capacity : null,
      color: s.color,
      label_x: s.labelPoint ? round5(s.labelPoint[0]) : null,
      label_y: s.labelPoint ? round5(s.labelPoint[1]) : null,
      seat_prefix: s.seatPrefix,
      generator: s.generator,
      sort_order: i,
      rows: s.rows.map((r, j) => ({ label: r.label, sort_order: j })),
      seats: s.kind === "GENERAL_ADMISSION" ? [] : s.seats.map((seat): SeatTuple => [seat.rowLabel, seat.label, seat.number, round5(seat.x), round5(seat.y), seat.kind, seat.baseStatus, seat.manual]),
    })),
    elements: c.elements.map((e, i): WireElement => ({
      kind: e.kind,
      shape: e.geometry.shape,
      geometry: geometryToWire(e.geometry),
      rotation: e.rotation,
      label: e.label,
      color: e.color,
      sort_order: i,
    })),
  };
}

/** Seats of a seated section, or the declared capacity of a general admission one. */
export function sectionCapacity(s: Section) {
  return s.kind === "GENERAL_ADMISSION" ? (s.capacity ?? 0) : s.seats.length;
}

export const mapCapacity = (m: Pick<VenueMap, "sections">) => m.sections.reduce((sum, s) => sum + sectionCapacity(s), 0);
