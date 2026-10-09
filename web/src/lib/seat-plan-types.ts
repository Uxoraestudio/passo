// Venue plan of an event as the buyer sees it (get_event_seat_map). Coordinates
// are normalised to the plan image (0–1). Seat state is live: AVAILABLE, BLOCKED,
// HELD (someone is paying) or SOLD.

export type Point = [number, number];
export type PlanSeatState = "AVAILABLE" | "BLOCKED" | "HELD" | "SOLD";
export type PlanSeatKind = "NORMAL" | "ACCESSIBLE" | "OBSTRUCTED";

export type PlanSeat = {
  rowLabel: string | null;
  label: string;
  number: number | null;
  x: number;
  y: number;
  kind: PlanSeatKind;
  state: PlanSeatState;
};

export type PlanSector = {
  id: string;
  name: string;
  shortLabel: string | null;
  numbered: boolean;
  capacity: number;
  price: number;
  color: string;
  polygon: Point[];
  labelPoint: Point | null;
  seats: PlanSeat[];
};

export type PlanElement = {
  kind: "STAGE" | "ENTRANCE" | "EXIT" | "BAR" | "BATHROOM" | "TEXT";
  shape: "rect" | "ellipse" | "polygon" | "point";
  geometry: { x?: number; y?: number; w?: number; h?: number; points?: Point[] };
  rotation: number;
  label: string | null;
  color: string | null;
};

export type EventPlan = {
  imageUrl: string | null;
  width: number;
  height: number;
  elements: PlanElement[];
  sectors: PlanSector[];
};

export function planImageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venue-maps/${path}`;
}

export function centroid(points: Point[]): Point {
  const n = points.length || 1;
  return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
}
