import type { ElementKind, MapElement, Point, Section, VenueMapContent } from "@/lib/venue-map-types";
import { applyMatrix, clamp01, toNorm, toWorld, type Size } from "./geometry";

// Pure, immutable edits of a plan. Every function returns a new content object
// so undo/redo can keep references to previous versions.

export type SelectionItem = { kind: "section" | "element"; id: string };

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
  return {
    ...c,
    sections: c.sections.filter((s) => !isSelected(sel, "section", s.id)),
    elements: c.elements.filter((e) => !isSelected(sel, "element", e.id)),
  };
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
  return {
    ...c,
    sections: c.sections.map((s) => (isSelected(sel, "section", s.id) ? translateSection(s, dx, dy) : s)),
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
