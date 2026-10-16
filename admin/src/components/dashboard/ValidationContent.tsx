"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import ValidationHeader from "./ValidationHeader";
import ValidationKpiRow from "./ValidationKpiRow";
import ValidEntryBanner from "./ValidEntryBanner";
import ValidatorConsole from "./ValidatorConsole";
import GatesTable from "./GatesTable";
import IncidentLog from "./IncidentLog";
import {
  getValidationOverview,
  listValidationEvents,
  validateTicket,
  ValidationError,
  type ValidationEvent,
  type ValidationOverview,
  type ValidationResponse,
} from "@/lib/validation-data";
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

/** Short beep and vibration so the operator knows the result without looking. */
function signal(ok: boolean) {
  try {
    navigator.vibrate?.(ok ? 80 : [120, 80, 120]);
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.12 : 0.35));
    osc.onended = () => ctx.close();
  } catch {
    // No sound available: the banner still shows the result.
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
  const [eventId, setEventId] = useState("");
  const [gate, setGate] = useState("");
  const [overview, setOverview] = useState<ValidationOverview | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [lastScan, setLastScan] = useState<{ response: ValidationResponse; at: string; gate: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [onlyRejected, setOnlyRejected] = useState(false);
  const busyRef = useRef(false);

  // Events, then the remembered one (or the next to happen) and the remembered door.
  useEffect(() => {
    let active = true;
    listValidationEvents()
      .then((list) => {
        if (!active) return;
        setEvents(list);
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
        signal(response.result === "valid");
        setError("");
        refresh(eventId);
      } catch (e) {
        signal(false);
        setError(e instanceof ValidationError ? e.message : "No pudimos validar la entrada. Inténtalo de nuevo.");
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [eventId, gate, refresh]
  );

  return (
    <div className={styles.page}>
      <ValidationHeader events={events ?? []} eventId={eventId} onEvent={chooseEvent} online={online} updatedAt={updatedAt} />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {events !== null && events.length === 0 && (
        <p className={styles.notice}>No hay eventos en venta ni recién realizados para validar. Publica un evento para usar esta pantalla.</p>
      )}

      <ValidEntryBanner key={lastScan?.at ?? "idle"} scan={lastScan} />

      <div className={styles.consoleGrid}>
        <div className={styles.consoleCol}>
          <ValidatorConsole gate={gate} onGate={chooseGate} busy={busy} disabled={!eventId} onCode={onCode} />
        </div>
        <div className={styles.gatesCol}>
          <GatesTable overview={overview} />
        </div>
      </div>

      <ValidationKpiRow overview={overview} />
      <IncidentLog scans={overview?.recent ?? []} onlyRejected={onlyRejected} onToggle={() => setOnlyRejected((v) => !v)} />
    </div>
  );
}
