"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MaterialIcon } from "@/components/icons";
import { useCanEdit } from "@/lib/access";
import { venueMapImageUrl } from "@/lib/venue-maps-data";
import {
  deleteZone,
  getEventSeatMap,
  saveZone,
  updateEventSeats,
  ZoneNameTakenError,
  type EventSeat,
  type EventSeatMap,
  type PriceZone,
  type SeatChanges,
} from "@/lib/event-seats-data";
import type { SelectMode } from "./SeatsCanvas";
import SelectionPanel from "./SelectionPanel";
import ZonesPanel from "./ZonesPanel";
import SeatsSummary from "./SeatsSummary";
import { describeSeat, SEAT_LEGEND } from "./seatStats";
import editorStyles from "../venue-editor/VenueEditor.module.css";
import styles from "./EventSeats.module.css";

const SeatsCanvas = dynamic(() => import("./SeatsCanvas"), {
  ssr: false,
  loading: () => <div className={editorStyles.canvasLoading}>Cargando plano…</div>,
});

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "no-plan" } | { state: "ready"; map: EventSeatMap };

const errorText = (e: unknown, fallback: string) => {
  const message = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? "");
  if (message.includes("FORBIDDEN")) return "Tu rol no permite editar eventos.";
  if (message.includes("ZONE_NOT_FOUND")) return "Esa zona ya no existe. Recarga la página.";
  return fallback;
};

/**
 * Seats of an event that uses a venue plan (Fase 5): price zones, blocked
 * seats (production, press, courtesies…) and accessible seats.
 */
export default function EventSeatsEditor({ eventId }: { eventId: string }) {
  const canEdit = useCanEdit("eventos");
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const flash = useCallback((tone: "ok" | "error", text: string) => {
    setNotice({ tone, text });
    if (tone === "ok") window.setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 4000);
  }, []);

  const reload = useCallback(async () => {
    const map = await getEventSeatMap(eventId);
    setLoad(map ? { state: "ready", map } : { state: "no-plan" });
    return map;
  }, [eventId]);

  useEffect(() => {
    let active = true;
    getEventSeatMap(eventId)
      .then((map) => active && setLoad(map ? { state: "ready", map } : { state: "no-plan" }))
      .catch(() => active && setLoad({ state: "error", message: "No pudimos cargar los asientos del evento. Revisa tu conexión y recarga la página." }));
    return () => {
      active = false;
    };
  }, [eventId]);

  const map = load.state === "ready" ? load.map : null;
  const zones = useMemo(() => new Map((map?.zones ?? []).map((z) => [z.id, z])), [map]);
  const sectorsById = useMemo(() => new Map((map?.sectors ?? []).map((s) => [s.id, s])), [map]);
  const seatsById = useMemo(() => new Map((map?.sectors ?? []).flatMap((s) => s.seats.map((seat) => [seat.id, seat] as const))), [map]);
  const selectedSeats = useMemo(() => [...selected].map((id) => seatsById.get(id)).filter((s): s is EventSeat => Boolean(s)), [selected, seatsById]);
  const seatsByZone = useMemo(() => {
    const out = new Map<string, number>();
    for (const seat of seatsById.values()) if (seat.zoneId) out.set(seat.zoneId, (out.get(seat.zoneId) ?? 0) + 1);
    return out;
  }, [seatsById]);
  const imagePath = map?.imagePath ?? null;
  const imageUrl = useMemo(() => (imagePath ? venueMapImageUrl(imagePath) : null), [imagePath]);
  const describe = useCallback((seat: EventSeat) => describeSeat(seat, sectorsById.get(seat.sectorId), zones), [sectorsById, zones]);

  const select = useCallback((ids: string[], mode: SelectMode) => {
    setSelected((prev) => {
      if (mode === "replace") return new Set(ids);
      const next = new Set(prev);
      for (const id of ids) {
        if (mode === "remove" || (mode === "toggle" && next.has(id))) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }, []);

  // Escape clears the selection (outside inputs and dialogs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("[aria-modal='true']")) return;
      if (e.target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      setSelected(new Set());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectSector = (sectorId: string) => select(sectorsById.get(sectorId)?.seats.map((s) => s.id) ?? [], "replace");

  const selectRows = () => {
    const rows = new Set(selectedSeats.map((s) => `${s.sectorId}|${s.rowLabel ?? ""}`));
    const ids = [...seatsById.values()].filter((s) => s.rowLabel !== null && rows.has(`${s.sectorId}|${s.rowLabel}`)).map((s) => s.id);
    select(ids, "add");
  };

  const apply = async (changes: SeatChanges, label: string) => {
    if (busy || selectedSeats.length === 0) return;
    setBusy(true);
    try {
      const result = await updateEventSeats(eventId, selectedSeats.map((s) => s.id), changes);
      await reload();
      const done = `${label}: ${result.updated.toLocaleString("es-CL")} ${result.updated === 1 ? "asiento actualizado" : "asientos actualizados"}.`;
      flash("ok", result.skipped > 0 ? `${done} ${result.skipped.toLocaleString("es-CL")} no se bloquearon porque están vendidos o en pago.` : done);
    } catch (e) {
      flash("error", errorText(e, "No pudimos actualizar los asientos. Inténtalo de nuevo."));
    } finally {
      setBusy(false);
    }
  };

  const onSaveZone = async (zone: Omit<PriceZone, "id"> & { id?: string }) => {
    if (!map) return null;
    try {
      const order = zone.id ? map.zones.findIndex((z) => z.id === zone.id) : map.zones.length;
      await saveZone(eventId, zone, order);
      await reload();
      flash("ok", zone.id ? `Zona ${zone.name} actualizada.` : `Zona ${zone.name} creada. Selecciona asientos y asígnala.`);
      return null;
    } catch (e) {
      if (e instanceof ZoneNameTakenError) return "Ya existe una zona con ese nombre en este evento.";
      return errorText(e, "No pudimos guardar la zona. Inténtalo de nuevo.");
    }
  };

  const onDeleteZone = async (zone: PriceZone) => {
    try {
      await deleteZone(zone.id);
      await reload();
      flash("ok", `Zona ${zone.name} eliminada. Sus asientos vuelven al precio del sector.`);
    } catch (e) {
      flash("error", errorText(e, "No pudimos eliminar la zona. Inténtalo de nuevo."));
    }
  };

  const backHref = `/eventos/${eventId}/editar/`;

  if (load.state === "loading") return <div className={editorStyles.stateCard}>Cargando asientos del evento…</div>;
  if (load.state !== "ready" || !map)
    return (
      <div className={editorStyles.stateCard} role={load.state === "error" ? "alert" : undefined}>
        <p>
          {load.state === "error"
            ? load.message
            : "Este evento no usa un plano con asientos. Elige un recinto con plano publicado en el evento y guárdalo para definir zonas de precio y bloqueos."}
        </p>
        <Link href={backHref} className={editorStyles.secondaryButton}>
          Volver al evento
        </Link>
      </div>
    );

  const totalSeats = seatsById.size;

  return (
    <div className={`${editorStyles.editor} ${styles.page}`}>
      <header className={editorStyles.topBar}>
        <Link href={backHref} className={editorStyles.back} aria-label="Volver al evento">
          <MaterialIcon decorative name="arrow_back" />
        </Link>
        <div className={editorStyles.titleBlock}>
          <h1>Asientos y precios</h1>
          <p>
            {map.title} · plano v{map.version} · {totalSeats.toLocaleString("es-CL")} asientos
          </p>
        </div>
        <div className={editorStyles.topActions}>
          <span className={editorStyles.saveState} aria-live="polite">
            {busy ? "Guardando…" : "Los cambios se guardan al aplicarlos"}
          </span>
          {!canEdit && <span className={styles.chip}>Solo lectura</span>}
        </div>
      </header>

      {notice && (
        <div className={editorStyles.notice} data-tone={notice.tone} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.text}
          <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
            <MaterialIcon decorative name="close" />
          </button>
        </div>
      )}

      <div className={styles.body}>
        <div className={editorStyles.canvasArea}>
          <SeatsCanvas map={map} imageUrl={imageUrl} zones={zones} selectedSeats={selectedSeats} onSelect={select} describe={describe} />
          <ul className={styles.legend} aria-label="Leyenda">
            {map.zones.map((z) => (
              <li key={z.id}>
                <span className={styles.dot} style={{ ["--dot" as string]: z.color }} aria-hidden="true" />
                {z.name}
              </li>
            ))}
            {SEAT_LEGEND.map((item) => (
              <li key={item.label}>
                <span className={styles.dot} style={item.style} data-blocked={item.blocked || undefined} aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <aside className={editorStyles.sidePanel} aria-label="Zonas, bloqueos y resumen">
          <SelectionPanel
            sectors={map.sectors}
            zones={map.zones}
            selected={selectedSeats}
            canEdit={canEdit}
            busy={busy}
            onSelectSector={selectSector}
            onSelectRows={selectRows}
            onClear={() => setSelected(new Set())}
            onApply={apply}
          />
          <ZonesPanel zones={map.zones} seatsByZone={seatsByZone} canEdit={canEdit} onSave={onSaveZone} onDelete={onDeleteZone} />
          <SeatsSummary sectors={map.sectors} zones={map.zones} />
        </aside>
      </div>
    </div>
  );
}
