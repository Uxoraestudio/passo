import Select from "@/components/Select";
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
        <Select
          width="auto"
          aria-label="Evento a validar"
          icon={<MaterialIcon decorative name="confirmation_number" />}
          value={eventId}
          onChange={onEvent}
          disabled={events.length === 0}
          placeholder="No hay eventos para validar"
          options={events.map((e) => ({ value: e.id, label: `${e.title} — ${when(e.event_date)}` }))}
        />
      </div>
    </section>
  );
}
