import { createClient } from "@/lib/supabase/client";
import {
  contentToWire,
  mapFromWire,
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
// Event snapshot (price zones and seat states live in event-seats-data.ts)
// ---------------------------------------------------------------------------

/** Copies a published plan into the event (its own snapshot). */
export async function snapshotVenueMapToEvent(eventId: string, mapId: string): Promise<{ sectors: number; seats: number; capacity: number }> {
  const { data, error } = await createClient().rpc("snapshot_venue_map_to_event", { p_event_id: eventId, p_map_id: mapId });
  if (error || !data) throw toError(error, "No pudimos asociar el plano al evento.");
  return data;
}
