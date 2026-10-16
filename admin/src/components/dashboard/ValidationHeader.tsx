import { MaterialIcon } from "@/components/icons";
import type { ValidationEvent } from "@/lib/validation-data";
import styles from "./ValidationHeader.module.css";

const when = (iso: string) =>
  new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Santiago" }).format(new Date(iso));

/** Which event is being checked at the door, and whether the screen is live. */
export default function ValidationHeader({
  events,
  eventId,
  onEvent,
  online,
  updatedAt,
}: {
  events: ValidationEvent[];
  eventId: string;
  onEvent: (id: string) => void;
  online: boolean;
  updatedAt: Date | null;
}) {
  return (
    <section className={styles.section}>
      <div>
        <div className={styles.liveRow}>
          <span className={styles.liveDot} data-off={!online} />
          <span className={styles.liveLabel}>{online ? "En tiempo real" : "Sin conexión"}</span>
          {updatedAt && <span className={styles.liveCaption}>• Actualizado {updatedAt.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}
        </div>
        <h1 className={styles.title}>Control de acceso y validación QR</h1>
      </div>

      <div className={styles.eventRow}>
        <label className={styles.eventPill}>
          <MaterialIcon decorative name="confirmation_number" className={styles.eventIcon} />
          <span className="sr-only">Evento a validar</span>
          <select className={styles.eventSelect} value={eventId} onChange={(e) => onEvent(e.target.value)} disabled={events.length === 0}>
            {events.length === 0 && <option value="">No hay eventos para validar</option>}
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} — {when(e.event_date)}
              </option>
            ))}
          </select>
          <MaterialIcon decorative name="expand_more" className={styles.chevronIcon} />
        </label>
      </div>
    </section>
  );
}
