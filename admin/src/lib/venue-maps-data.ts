import { createClient } from "@/lib/supabase/client";
import {
  contentToWire,
  mapFromWire,
  type ElementGeometry,
  type ElementKind,
  type Point,
  type SeatKind,
  type SeatState,
  type VenueMap,
  type VenueMapContent,
  type VenueMapSummary,
  type WireMap,
} from "@/lib/venue-map-types";

const BUCKET = "venue-maps";
export const MAP_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAP_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

const messages: Record<string, string> = {
  FORBIDDEN: "Tu rol no permite editar recintos ni eventos.",
  VENUE_NOT_FOUND: "Ese recinto ya no existe.",
  MAP_NOT_FOUND: "Ese plano ya no existe. Recarga la página.",
  MAP_PUBLISHED: "Esta versión ya está publicada y no se puede modificar. Crea una nueva versión para editarla.",
  MAP_NOT_PUBLISHED: "Publica el plano antes de usarlo en un evento.",
  MAP_EMPTY: "El plano no tiene sectores.",
  SECTION_WITHOUT_CAPACITY: "Hay un sector sin asientos ni capacidad",
  INVALID_PAYLOAD: "No pudimos leer el plano. Recarga la página e inténtalo de nuevo.",
  INVALID_POLYGON: "La forma de un sector no es válida (necesita al menos 3 puntos dentro del plano)",
  INVALID_SECTION: "Un sector tiene datos no válidos",
  INVALID_ELEMENT: "Un elemento del plano (escenario, acceso…) no es válido.",
  GA_WITH_SEATS: "Un sector de entrada general no puede tener asientos",
  DUPLICATE_SEAT_LABEL: "Hay asientos con la misma etiqueta",
  DUPLICATE_ROW_LABEL: "Hay filas con la misma etiqueta",
  DUPLICATE_NAME: "Hay dos sectores con el mismo nombre",
  ROW_NOT_FOUND: "Un asiento apunta a una fila que no existe",
  TOO_MANY_SEATS: "El plano supera el máximo de 30.000 asientos.",
  TOO_MANY_ITEMS: "El plano supera el máximo de 500 sectores o elementos.",
  EVENT_NOT_FOUND: "Ese evento ya no existe.",
  EVENT_HAS_SALES: "Este evento ya tiene entradas vendidas o reservadas; no se puede cambiar su plano.",
};

export class VenueMapError extends Error {
  constructor(
    message: string,
    readonly code: string,
    /** Section name and/or label the database pointed at, e.g. "Platea Baja: A12". */
    readonly detail: string | null
  ) {
    super(message);
  }
}

function toError(error: { message?: string; details?: string | null } | null, fallback: string): VenueMapError {
  const code = Object.keys(messages).find((k) => error?.message?.includes(k));
  if (!code) return new VenueMapError(fallback, "UNKNOWN", null);
  const detail = error?.details || null;
  return new VenueMapError(detail ? `${messages[code]}: ${detail}.` : messages[code], code, detail);
}

// ---------------------------------------------------------------------------
// Plan images
// ---------------------------------------------------------------------------

export function venueMapImageUrl(path: string) {
  return createClient().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      reject(new VenueMapError("No pudimos leer la imagen. Prueba con otro archivo PNG, JPG o WebP.", "INVALID_IMAGE", null));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/** Uploads a plan image for a venue and returns its storage path and pixel size. */
export async function uploadVenueMapImage(venueId: string, file: File) {
  if (!MAP_IMAGE_TYPES.includes(file.type)) {
    throw new VenueMapError("Formato no admitido. Usa PNG, JPG o WebP.", "INVALID_IMAGE", null);
  }
  if (file.size > MAP_IMAGE_MAX_BYTES) {
    throw new VenueMapError(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 10 MB.`, "IMAGE_TOO_LARGE", null);
  }
  const { width, height } = await readImageSize(file);
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${venueId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await createClient().storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new VenueMapError("No pudimos subir la imagen. Revisa tu conexión e inténtalo de nuevo.", "UPLOAD_FAILED", null);
  return { path, width, height, url: venueMapImageUrl(path) };
}

// ---------------------------------------------------------------------------
// Venue maps
// ---------------------------------------------------------------------------

export async function listVenueMaps(venueId: string): Promise<VenueMapSummary[]> {
  const { data, error } = await createClient()
    .from("venue_maps")
    .select("id, version, status, updated_at, published_at")
    .eq("venue_id", venueId)
    .order("version", { ascending: false });
  if (error) throw toError(error, "No pudimos cargar las versiones del plano.");
  return (data ?? []).map((m) => ({ id: m.id, version: m.version, status: m.status, updatedAt: m.updated_at, publishedAt: m.published_at }));
}

export async function getVenueMap(mapId: string): Promise<VenueMap> {
  const { data, error } = await createClient().rpc("get_venue_map", { p_map_id: mapId });
  if (error || !data) throw toError(error, "No pudimos cargar el plano.");
  return mapFromWire(data as WireMap);
}

/** Returns the venue's open draft, or creates the next version (optionally copying `fromMapId`). */
export async function createVenueMapDraft(venueId: string, fromMapId: string | null = null): Promise<VenueMapSummary> {
  const { data, error } = await createClient().rpc("create_venue_map_draft", { p_venue_id: venueId, p_from_map_id: fromMapId });
  if (error || !data) throw toError(error, "No pudimos crear el borrador del plano.");
  return { id: data.id, version: data.version, status: data.status, updatedAt: data.updated_at, publishedAt: data.published_at };
}

/** Replaces the whole content of a draft in one transaction. */
export async function saveVenueMap(mapId: string, content: VenueMapContent): Promise<{ sections: number; seats: number; capacity: number }> {
  const { data, error } = await createClient().rpc("save_venue_map", { p_map_id: mapId, p_payload: contentToWire(content) });
  if (error || !data) throw toError(error, "No pudimos guardar el plano. Tus cambios siguen en pantalla; inténtalo de nuevo.");
  return data;
}

export async function publishVenueMap(mapId: string): Promise<{ version: number; capacity: number }> {
  const { data, error } = await createClient().rpc("publish_venue_map", { p_map_id: mapId });
  if (error || !data) throw toError(error, "No pudimos publicar el plano.");
  return { version: data.version, capacity: data.capacity };
}

export async function deleteVenueMapDraft(mapId: string) {
  const { error } = await createClient().from("venue_maps").delete().eq("id", mapId).eq("status", "draft");
  if (error) throw toError(error, "No pudimos descartar el borrador.");
}

// ---------------------------------------------------------------------------
// Event seat map
// ---------------------------------------------------------------------------

export type PriceZone = { id: string; name: string; color: string; price: number };

export type EventSeat = {
  rowLabel: string | null;
  label: string;
  number: number | null;
  x: number;
  y: number;
  kind: SeatKind;
  state: SeatState;
  priceZoneId: string | null;
};

export type EventSector = {
  id: string;
  name: string;
  shortLabel: string | null;
  numbered: boolean;
  capacity: number;
  price: number;
  color: string;
  polygon: Point[];
  labelPoint: Point | null;
  priceZoneId: string | null;
  seats: EventSeat[];
};

export type EventSeatMap = {
  eventId: string;
  mapId: string;
  version: number;
  imagePath: string | null;
  imageWidth: number;
  imageHeight: number;
  elements: { kind: ElementKind; geometry: ElementGeometry; rotation: number; label: string | null; color: string | null }[];
  priceZones: PriceZone[];
  sectors: EventSector[];
};

type WireEventSeat = [string | null, string, number | null, number, number, SeatKind, SeatState, string | null];

/** Copies a published plan into the event (its own snapshot). */
export async function snapshotVenueMapToEvent(eventId: string, mapId: string): Promise<{ sectors: number; seats: number; capacity: number }> {
  const { data, error } = await createClient().rpc("snapshot_venue_map_to_event", { p_event_id: eventId, p_map_id: mapId });
  if (error || !data) throw toError(error, "No pudimos asociar el plano al evento.");
  return data;
}

/** The event's plan with the live state of each seat, or null if it has no plan. */
export async function getEventSeatMap(eventId: string): Promise<EventSeatMap | null> {
  const { data, error } = await createClient().rpc("get_event_seat_map", { p_event_id: eventId });
  if (error) throw toError(error, "No pudimos cargar el plano del evento.");
  if (!data) return null;
  const w = data as {
    event_id: string;
    map_id: string;
    version: number;
    image_path: string | null;
    image_width: number;
    image_height: number;
    elements: { kind: ElementKind; shape: ElementGeometry["shape"]; geometry: Record<string, unknown>; rotation: number; label: string | null; color: string | null }[];
    price_zones: PriceZone[];
    sectors: {
      id: string;
      name: string;
      short_label: string | null;
      numbered: boolean;
      capacity: number;
      price: number | string;
      color: string;
      polygon: Point[];
      label_point: Point | null;
      price_zone_id: string | null;
      seats: WireEventSeat[];
    }[];
  };
  const mapped = mapFromWire({
    id: w.map_id,
    venue_id: "",
    version: w.version,
    status: "published",
    image_path: w.image_path,
    image_width: w.image_width,
    image_height: w.image_height,
    scale_m_per_px: null,
    calibration: null,
    notes: null,
    updated_at: "",
    published_at: null,
    sections: [],
    elements: w.elements,
  });
  return {
    eventId: w.event_id,
    mapId: w.map_id,
    version: w.version,
    imagePath: w.image_path,
    imageWidth: w.image_width,
    imageHeight: w.image_height,
    elements: mapped.elements,
    priceZones: w.price_zones,
    sectors: w.sectors.map((s) => ({
      id: s.id,
      name: s.name,
      shortLabel: s.short_label,
      numbered: s.numbered,
      capacity: s.capacity,
      price: Number(s.price),
      color: s.color,
      polygon: s.polygon,
      labelPoint: s.label_point,
      priceZoneId: s.price_zone_id,
      seats: s.seats.map(([rowLabel, label, number, x, y, kind, state, priceZoneId]) => ({
        rowLabel,
        label,
        number,
        x: Number(x),
        y: Number(y),
        kind,
        state,
        priceZoneId,
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Price zones and seat status (event level)
// ---------------------------------------------------------------------------

// Labels go in the URL filter, so large selections are sent in batches.
const LABEL_BATCH = 200;

async function updateSeats(sectorId: string, labels: string[], patch: Record<string, unknown>, failure: string) {
  const supabase = createClient();
  for (let i = 0; i < labels.length; i += LABEL_BATCH) {
    const { error } = await supabase.from("event_seats").update(patch).eq("sector_id", sectorId).in("label", labels.slice(i, i + LABEL_BATCH));
    if (error) throw new VenueMapError(failure, error.code ?? "UNKNOWN", null);
  }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

export async function savePriceZone(eventId: string, zone: Omit<PriceZone, "id"> & { id?: string }): Promise<PriceZone> {
  const supabase = createClient();
  const payload = { event_id: eventId, name: zone.name.trim(), color: zone.color, price: Math.max(0, Math.round(zone.price)) };
  const query = zone.id
    ? supabase.from("event_price_zones").update(payload).eq("id", zone.id)
    : supabase.from("event_price_zones").insert(payload);
  const { data, error } = await query.select("id, name, color, price").single();
  if (error || !data) {
    throw new VenueMapError(error?.code === "23505" ? "Ya existe una zona con ese nombre." : "No pudimos guardar la zona de precio.", error?.code ?? "UNKNOWN", null);
  }
  return data;
}

export async function deletePriceZone(zoneId: string) {
  const { error } = await createClient().from("event_price_zones").delete().eq("id", zoneId);
  if (error) throw new VenueMapError("No pudimos eliminar la zona de precio.", error.code ?? "UNKNOWN", null);
}

/** Blocks or unblocks seats of one sector (production, press, courtesies…). */
export async function setSeatsBlocked(sectorId: string, labels: string[], blocked: boolean, reason: string | null = null) {
  await updateSeats(sectorId, labels, { base_status: blocked ? "BLOCKED" : "AVAILABLE", block_reason: blocked ? reason : null }, "No pudimos actualizar los asientos.");
}

/** Assigns a price zone to seats of one sector (null removes it). */
export async function setSeatsPriceZone(sectorId: string, labels: string[], zoneId: string | null) {
  await updateSeats(sectorId, labels, { price_zone_id: zoneId }, "No pudimos asignar la zona de precio.");
}
