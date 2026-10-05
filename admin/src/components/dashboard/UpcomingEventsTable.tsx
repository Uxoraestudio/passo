import Link from "next/link";
import { ChevronRightTinyIcon, EyeIcon, TagIcon } from "@/components/icons";
import type { EventRecord } from "@/lib/events-data";
import styles from "./UpcomingEventsTable.module.css";

const statusView: Record<string, { label: string; tone: "a-la-venta" | "agotado" | "proximamente" }> = {
  "en-venta": { label: "En venta", tone: "a-la-venta" },
  "casi-agotado": { label: "Casi agotado", tone: "agotado" },
  proximamente: { label: "Próximamente", tone: "proximamente" },
  borrador: { label: "Borrador", tone: "proximamente" },
  finalizado: { label: "Finalizado", tone: "agotado" },
};

const day = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Santiago" });
const time = new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Santiago" });

export default function UpcomingEventsTable({ events }: { events: EventRecord[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Próximos eventos</h3>
          <p className={styles.subtitle}>Venta y ocupación de lo que viene.</p>
        </div>
        <Link href="/eventos/" className={styles.link}>
          Ver todos los eventos
          <ChevronRightTinyIcon className={styles.linkIcon} />
        </Link>
      </div>
      <div className={styles.tableWrap}>
        {events.length === 0 ? (
          <p className={styles.subtitle}>No hay eventos próximos publicados.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Fecha</th>
                <th>Lugar</th>
                <th>Vendidas</th>
                <th>Ocupación</th>
                <th>Estado</th>
                <th className={styles.actionsHead}>Ver</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const view = statusView[event.status] ?? statusView.proximamente;
                const occupancy = event.capacity > 0 ? Math.round((event.sold / event.capacity) * 100) : 0;
                return (
                  <tr key={event.id}>
                    <td>
                      <div className={styles.eventCell}>
                        <div
                          className={styles.thumb}
                          style={event.image_url ? { backgroundImage: `url("${event.image_url}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                        >
                          {!event.image_url && <TagIcon className={styles.thumbIcon} />}
                        </div>
                        <div>
                          <p className={styles.eventName}>{event.title}</p>
                          <p className={styles.eventCategory}>{event.category ?? "Sin categoría"}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className={styles.dateMain}>{day.format(new Date(event.event_date))}</p>
                      <p className={styles.dateSub}>{time.format(new Date(event.event_date))}</p>
                    </td>
                    <td>
                      <p className={styles.dateMain}>{event.venue}</p>
                      <p className={styles.dateSub}>{event.city}</p>
                    </td>
                    <td>
                      <p className={styles.strong}>{event.sold.toLocaleString("es-CL")}</p>
                      <p className={styles.dateSub}>de {event.capacity.toLocaleString("es-CL")}</p>
                    </td>
                    <td>
                      <p className={styles.strong}>{occupancy}%</p>
                    </td>
                    <td>
                      <span className={styles.status} data-status={view.tone}>
                        {view.label}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/eventos/${event.id}/editar/`} aria-label={`Abrir ${event.title}`}>
                          <EyeIcon className={styles.actionIcon} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
