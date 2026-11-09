import Select from "@/components/Select";
import { MaterialIcon } from "@/components/icons";
import type { ValidationEvent } from "@/lib/validation-data";
import styles from "./ValidationHeader.module.css";

const when = (iso: string) =>
  new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Santiago" }).format(new Date(iso));

/** Title, live status and the two things to set before scanning: the event and the door. */
export default function ValidationHeader({
  events,
  canChoose,
  eventId,
  onEvent,
  gate,
  onGate,
  online,
  updatedAt,
}: {
  events: ValidationEvent[];
  /** Producers pick any event; a validator works the one the producer assigned. */
  canChoose: boolean;
  eventId: string;
  onEvent: (id: string) => void;
  gate: string;
  onGate: (gate: string) => void;
  online: boolean;
  updatedAt: Date | null;
}) {
  const current = events.find((e) => e.id === eventId) ?? null;
  return (
    <section className={styles.section}>
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>Validación</h1>
          <p className={styles.subtitle}>Escanea las entradas en la puerta y sigue el ingreso en vivo.</p>
        </div>
        <div className={styles.liveRow} role="status">
          <span className={styles.liveDot} data-off={!online} />
          <span className={styles.liveLabel} data-off={!online}>
            {online ? "En vivo" : "Sin conexión"}
          </span>
          {updatedAt && online && (
            <span className={styles.liveCaption}>· {updatedAt.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          )}
        </div>
      </div>

      <div className={styles.setup}>
        <div className={styles.setupField}>
          <span className={styles.setupLabel} id="val-event-label">
            {canChoose ? "Evento" : "Tu evento"}
          </span>
          {!canChoose && events.length <= 1 ? (
            <div className={styles.assigned}>
              <MaterialIcon decorative name="confirmation_number" className={styles.assignedIcon} />
              <span className={styles.assignedText}>
                <b>{current?.title ?? "Sin evento asignado"}</b>
                <small>{current ? `${when(current.event_date)}${current.venue ? ` · ${current.venue}` : ""}` : "El productor te asigna el evento"}</small>
              </span>
              {current && <span className={styles.assignedTag}>Asignado</span>}
            </div>
          ) : (
          <Select
            size="lg"
            aria-label="Evento a validar"
            icon={<MaterialIcon decorative name="confirmation_number" />}
            value={eventId}
            onChange={onEvent}
            disabled={events.length === 0}
            placeholder="No hay eventos para validar"
            options={events.map((e) => ({ value: e.id, label: `${e.title} — ${when(e.event_date)}` }))}
          />
          )}
        </div>
        <label className={styles.setupField}>
          <span className={styles.setupLabel}>
            Puerta o acceso <i>opcional</i>
          </span>
          <span className={styles.gateWrap}>
            <MaterialIcon decorative name="door_front" className={styles.gateIcon} />
            <input className={styles.gateInput} value={gate} maxLength={40} placeholder="Ej: Puerta Norte" onChange={(e) => onGate(e.target.value)} />
          </span>
        </label>
      </div>
    </section>
  );
}
