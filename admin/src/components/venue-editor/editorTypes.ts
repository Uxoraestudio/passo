import type { ElementKind } from "@/lib/venue-map-types";

export type ElementTool = `element:${ElementKind}`;
export type Tool = "select" | "pan" | "section" | "calibrate" | ElementTool;

export type LayerKey = "background" | "sections" | "seats" | "elements" | "grid";

export type Layers = Record<LayerKey, { visible: boolean; locked: boolean }> & { backgroundOpacity: number };

export const defaultLayers: Layers = {
  background: { visible: true, locked: true },
  sections: { visible: true, locked: false },
  seats: { visible: true, locked: true },
  elements: { visible: true, locked: false },
  grid: { visible: false, locked: true },
  backgroundOpacity: 0.85,
};

export const elementKindOf = (tool: Tool): ElementKind | null => (tool.startsWith("element:") ? (tool.slice(8) as ElementKind) : null);
