"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SkeletonHeader, SkeletonKpis, SkeletonList, SkeletonTable } from "@/components/Skeleton";
import ValidationHeader from "./ValidationHeader";
import ValidationKpiRow from "./ValidationKpiRow";
import ValidEntryBanner from "./ValidEntryBanner";
import ValidatorConsole from "./ValidatorConsole";
import GatesTable from "./GatesTable";
import IncidentLog from "./IncidentLog";
import ValidationSummary from "./ValidationSummary";
import { MaterialIcon } from "@/components/icons";
import {
  getValidationOverview,
  listValidationEvents,
  validateTicket,
  ValidationError,
  type ValidationEvent,
  type ValidationOverview,
  type ValidationResponse,
} from "@/lib/validation-data";
import { playScanSound } from "@/lib/scan-sound";
import styles from "./ValidationContent.module.css";

const REFRESH_MS = 10_000;
const EVENT_KEY = "passo.validacion.evento";
const GATE_KEY = "passo.validacion.puerta";

function stored(key: string) {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function store(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode: the choice just isn't remembered.
  }
}

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export default function ValidationContent() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [events, setEvents] = useState<ValidationEvent[] | null>(null);
  // Producers pick the event; door validators work the one(s) assigned to them.
  const [canChoose, setCanChoose] = useState(true);
  const [eventId, setEventId] = useState("");
  const [gate, setGate] = useState("");
  const [overview, setOverview] = useState<ValidationOverview | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [lastScan, setLastScan] = useState<{ response: ValidationResponse; at: string; gate: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [onlyRejected, setOnlyRejected] = useState(false);
  const [tab, setTab] = useState<"scan" | "stats">("scan");

  const chooseTab = (next: "scan" | "stats") => {
    setTab(next);
    // Back on the scan tab, the reader's field is ready for the next code.
    if (next === "scan") window.setTimeout(() => document.getElementById("manual-code")?.focus(), 0);
  };
  const busyRef = useRef(false);

  // Events, then the remembered one (or the next to happen) and the remembered door.
  useEffect(() => {
    let active = true;
    listValidationEvents()
      .then(({ events: list, canChoose: choose }) => {
        if (!active) return;
        setEvents(list);
        setCanChoose(choose);
        const remembered = stored(EVENT_KEY);
        const now = Date.now();
        const next = list.find((e) => new Date(e.event_date).getTime() > now - 12 * 3_600_000) ?? list[list.length - 1];
        setEventId(list.some((e) => e.id === remembered) ? remembered : (next?.id ?? ""));
        setGate(stored(GATE_KEY));
      })
      .catch((e) => active && setError(e instanceof ValidationError ? e.message : "No pudimos cargar los eventos."));
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const data = await getValidationOverview(id);
      setOverview(data);
      setUpdatedAt(new Date());
      setError("");
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : "No pudimos actualizar los números del evento.");
    }
  }, []);

  useEffect(() => {
    if (!eventId) return;
    const first = window.setTimeout(() => refresh(eventId), 0);
    const timer = window.setInterval(() => refresh(eventId), REFRESH_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [eventId, refresh]);

  const chooseEvent = (id: string) => {
    setEventId(id);
    setOverview(null);
    setLastScan(null);
    store(EVENT_KEY, id);
  };

  const chooseGate = (value: string) => {
    setGate(value);
    store(GATE_KEY, value);
  };

  const onCode = useCallback(
    async (code: string) => {
      if (!eventId || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const response = await validateTicket(eventId, code, gate.trim());
        setLastScan({ response, at: new Date().toISOString(), gate: gate.trim() });
        playScanSound(response.result);
        setError("");
        refresh(eventId);
      } catch (e) {
        playScanSound("error");
        setError(e instanceof ValidationError ? e.message : "No pudimos validar la entrada. Inténtalo de nuevo.");
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [eventId, gate, refresh]
  );

  const loadingNumbers = !overview && !!eventId && !error;

  return (
    <div className={styles.page}>
      {events === null && !error ? (
        <SkeletonHeader />
      ) : (
        <ValidationHeader
          events={events ?? []}
          canChoose={canChoose}
          eventId={eventId}
          onEvent={chooseEvent}
          gate={gate}
          onGate={chooseGate}
          online={online}
          updatedAt={updatedAt}
        />
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {events !== null && events.length === 0 && (
        <p className={styles.notice}>
          {canChoose
            ? "No hay eventos en venta ni recién realizados para validar. Publica un evento para usar esta pantalla."
            : "Todavía no tienes un evento asignado. Pídele al productor que te asigne al evento donde trabajarás en la puerta."}
        </p>
      )}

      <div className={styles.tabs} role="tablist" aria-label="Validación">
        {(
          [
            ["scan", "qr_code_scanner", "Escanear"],
            ["stats", "monitoring", "Estadísticas"],
          ] as const
        ).map(([id, icon, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`val-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`val-panel-${id}`}
            className={styles.tab}
            onClick={() => chooseTab(id)}
          >
            <MaterialIcon decorative name={icon} />
            {label}
          </button>
        ))}
      </div>

      {/* Scan: what the door needs, and nothing else. Kept mounted so the camera and the result survive a look at the numbers. */}
      <div role="tabpanel" id="val-panel-scan" aria-labelledby="val-tab-scan" hidden={tab !== "scan"} className={styles.scanGrid}>
        <div className={styles.scanMain}>
          <ValidEntryBanner key={lastScan?.at ?? "idle"} scan={lastScan} />
          <ValidatorConsole busy={busy} disabled={!eventId} onCode={onCode} lastScan={lastScan} />
        </div>
        <div className={styles.scanSide}>
          {loadingNumbers ? <SkeletonList rows={2} thumb="none" label="Cargando resumen…" /> : <ValidationSummary overview={overview} />}
          {loadingNumbers ? (
            <SkeletonList rows={4} label="Cargando últimos escaneos…" />
          ) : (
            <IncidentLog title="Últimos escaneos" limit={6} scans={overview?.recent ?? []} onlyRejected={onlyRejected} onToggle={() => setOnlyRejected((v) => !v)} />
          )}
        </div>
      </div>

      <div role="tabpanel" id="val-panel-stats" aria-labelledby="val-tab-stats" hidden={tab !== "stats"} className={styles.statsStack}>
        {loadingNumbers ? (
          <>
            <SkeletonKpis label="Cargando indicadores de validación…" />
            <SkeletonTable rows={4} columns={3} label="Cargando ingresos por sector…" />
          </>
        ) : (
          <>
            <ValidationKpiRow overview={overview} />
            <div className={styles.statsGrid}>
              <GatesTable overview={overview} />
              <IncidentLog scans={overview?.recent ?? []} onlyRejected={onlyRejected} onToggle={() => setOnlyRejected((v) => !v)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
