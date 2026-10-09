import type { ElementKind, MapElement, Point, Row, Seat, Section, VenueMapContent } from "@/lib/venue-map-types";
import { applyMatrix, clamp01, toNorm, toWorld, type Size } from "./geometry";

// Pure, immutable edits of a plan. Every function returns a new content object
// so undo/redo can keep references to previous versions.

/** Seats are selected by "sectionId::label" (labels are unique within a section). */
export type SelectionItem = { kind: "section" | "element" | "seat"; id: string };

export const seatRef = (sectionId: string, label: string) => `${sectionId}::${label}`;
export function parseSeatRef(id: string): { sectionId: string; label: string } {
  const at = id.indexOf("::");
  return { sectionId: id.slice(0, at), label: id.slice(at + 2) };
}

/** Labels of the selected seats, grouped by section. */
function seatsBySection(sel: SelectionItem[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const item of sel) {
    if (item.kind !== "seat") continue;
    const { sectionId, label } = parseSeatRef(item.id);
    map.set(sectionId, (map.get(sectionId) ?? new Set()).add(label));
  }
  return map;
}

export const SECTION_COLORS = ["#6534f5", "#ff782d", "#0d9488", "#db2777", "#2563eb", "#ca8a04", "#7c3aed", "#059669"];

/** Default colour per element kind when the element has no colour of its own. */
export const ELEMENT_COLORS: Record<ElementKind, string> = {
  STAGE: "#1c1a2a",
  ENTRANCE: "#059669",
  EXIT: "#dc2626",
  BAR: "#ca8a04",
  BATHROOM: "#2563eb",
  TEXT: "#1c1a2a",
};

export const ELEMENT_LABELS: Record<ElementKind, string> = {
  STAGE: "Escenario",
  ENTRANCE: "Entrada",
  EXIT: "Salida",
  BAR: "Bar",
  BATHROOM: "Baños",
  TEXT: "Texto",
};

const isSelected = (sel: SelectionItem[], kind: SelectionItem["kind"], id: string) => sel.some((s) => s.kind === kind && s.id === id);

const sizeOf = (c: VenueMapContent): Size => ({ width: c.imageWidth, height: c.imageHeight });

export function nextSectionName(c: VenueMapContent) {
  const used = new Set(c.sections.map((s) => s.name.toLowerCase()));
  let n = c.sections.length + 1;
  while (used.has(`sector ${n}`)) n++;
  return `Sector ${n}`;
}

export function addSection(c: VenueMapContent, polygon: Point[]): { content: VenueMapContent; id: string } {
  const id = crypto.randomUUID();
  const section: Section = {
    id,
    name: nextSectionName(c),
    shortLabel: null,
    kind: "SEATED",
    polygon,
    capacity: null,
    color: SECTION_COLORS[c.sections.length % SECTION_COLORS.length],
    labelPoint: null,
    seatPrefix: "",
    generator: null,
    rows: [],
    seats: [],
  };
  return { content: { ...c, sections: [...c.sections, section] }, id };
}

export function updateSection(c: VenueMapContent, id: string, patch: Partial<Section>): VenueMapContent {
  return { ...c, sections: c.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

export function addElement(c: VenueMapContent, kind: ElementKind, at: Point): { content: VenueMapContent; id: string } {
  const id = crypto.randomUUID();
  const [x, y] = at;
  // Stage and bars are areas; entrances, exits, bathrooms and text are markers.
  const area = kind === "STAGE" ? { w: 0.3, h: 0.07 } : kind === "BAR" ? { w: 0.08, h: 0.05 } : null;
  const element: MapElement = {
    id,
    kind,
    geometry: area
      ? { shape: "rect", x: clamp01(x - area.w / 2), y: clamp01(y - area.h / 2), w: area.w, h: area.h }
      : { shape: "point", x, y },
    rotation: 0,
    label: ELEMENT_LABELS[kind],
    color: null,
  };
  return { content: { ...c, elements: [...c.elements, element] }, id };
}

export function updateElement(c: VenueMapContent, id: string, patch: Partial<MapElement>): VenueMapContent {
  return { ...c, elements: c.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}

export function deleteItems(c: VenueMapContent, sel: SelectionItem[]): VenueMapContent {
  const seats = seatsBySection(sel);
  return {
    ...c,
    sections: c.sections
      .filter((s) => !isSelected(sel, "section", s.id))
      .map((s) => (seats.has(s.id) ? { ...s, seats: s.seats.filter((seat) => !seats.get(s.id)!.has(seat.label)) } : s)),
    elements: c.elements.filter((e) => !isSelected(sel, "element", e.id)),
  };
}

/** Edits the selected seats; every edited seat becomes "manual" so regeneration keeps it. */
export function updateSeats(c: VenueMapContent, sel: SelectionItem[], patch: Partial<Pick<Seat, "kind" | "baseStatus" | "label">>): VenueMapContent {
  const seats = seatsBySection(sel);
  if (seats.size === 0) return c;
  return {
    ...c,
    sections: c.sections.map((s) =>
      seats.has(s.id) ? { ...s, seats: s.seats.map((seat) => (seats.get(s.id)!.has(seat.label) ? { ...seat, ...patch, manual: true } : seat)) } : s
    ),
  };
}

/** Replaces a section's rows and seats with a generation result and remembers its parameters. */
export function applyGeneration(c: VenueMapContent, sectionId: string, rows: Row[], seats: Seat[], params: Record<string, unknown>): VenueMapContent {
  return updateSection(c, sectionId, { rows, seats, generator: params });
}

const shift = ([x, y]: Point, dx: number, dy: number): Point => [clamp01(x + dx), clamp01(y + dy)];

function translateSection(s: Section, dx: number, dy: number): Section {
  return {
    ...s,
    polygon: s.polygon.map((p) => shift(p, dx, dy)),
    labelPoint: s.labelPoint ? shift(s.labelPoint, dx, dy) : null,
    seats: s.seats.map((seat) => {
      const [x, y] = shift([seat.x, seat.y], dx, dy);
      return { ...seat, x, y };
    }),
  };
}

function translateElement(e: MapElement, dx: number, dy: number): MapElement {
  const g = e.geometry;
  if (g.shape === "polygon") return { ...e, geometry: { ...g, points: g.points.map((p) => shift(p, dx, dy)) } };
  return { ...e, geometry: { ...g, x: clamp01(g.x + dx), y: clamp01(g.y + dy) } };
}

/** Moves the selected items by a normalised delta (dragging, arrow keys). */
export function translateItems(c: VenueMapContent, sel: SelectionItem[], dx: number, dy: number): VenueMapContent {
  if (dx === 0 && dy === 0) return c;
  const seats = seatsBySection(sel);
  return {
    ...c,
    sections: c.sections.map((s) => {
      if (isSelected(sel, "section", s.id)) return translateSection(s, dx, dy);
      if (!seats.has(s.id)) return s;
      // Moving a seat by hand marks it manual.
      return {
        ...s,
        seats: s.seats.map((seat) => {
          if (!seats.get(s.id)!.has(seat.label)) return seat;
          const [x, y] = shift([seat.x, seat.y], dx, dy);
          return { ...seat, x, y, manual: true };
        }),
      };
    }),
    elements: c.elements.map((e) => (isSelected(sel, "element", e.id) ? translateElement(e, dx, dy) : e)),
  };
}

/** Bakes a world-space transform (rotate/scale from the transformer) into a section. */
export function transformSection(c: VenueMapContent, id: string, matrix: number[]): VenueMapContent {
  const size = sizeOf(c);
  const map = (p: Point): Point => toNorm(applyMatrix(matrix, toWorld(p, size)), size);
  return updateSectionWith(c, id, (s) => ({
    ...s,
    polygon: s.polygon.map(map),
    labelPoint: s.labelPoint ? map(s.labelPoint) : null,
    seats: s.seats.map((seat) => {
      const [x, y] = map([seat.x, seat.y]);
      return { ...seat, x, y };
    }),
  }));
}

function updateSectionWith(c: VenueMapContent, id: string, fn: (s: Section) => Section): VenueMapContent {
  return { ...c, sections: c.sections.map((s) => (s.id === id ? fn(s) : s)) };
}

export function moveVertex(c: VenueMapContent, id: string, index: number, to: Point): VenueMapContent {
  return updateSectionWith(c, id, (s) => ({ ...s, polygon: s.polygon.map((p, i) => (i === index ? to : p)) }));
}

export function insertVertex(c: VenueMapContent, id: string, afterIndex: number, at: Point): VenueMapContent {
  return updateSectionWith(c, id, (s) => ({ ...s, polygon: [...s.polygon.slice(0, afterIndex + 1), at, ...s.polygon.slice(afterIndex + 1)] }));
}

export function removeVertex(c: VenueMapContent, id: string, index: number): VenueMapContent {
  return updateSectionWith(c, id, (s) => (s.polygon.length <= 3 ? s : { ...s, polygon: s.polygon.filter((_, i) => i !== index) }));
}
