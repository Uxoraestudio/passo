import Link from "next/link";
import { ChevronRightTinyIcon, EyeIcon, MoreIcon, TagIcon } from "@/components/icons";
import { statusLabels, upcomingEvents } from "@/lib/dashboard-data";
import styles from "./UpcomingEventsTable.module.css";

export default function UpcomingEventsTable() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Próximos eventos</h3>
          <p className={styles.subtitle}>Gestiona y monitorea tus próximos eventos.</p>
        </div>
        <Link href="#" className={styles.link}>
          Ver todos los eventos
          <ChevronRightTinyIcon className={styles.linkIcon} />
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Evento</th>
              <th>Fecha</th>
              <th>Lugar</th>
              <th>Vendidas</th>
              <th>Capacidad</th>
              <th>Estado</th>
              <th className={styles.actionsHead}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {upcomingEvents.map((event) => (
              <tr key={event.id}>
                <td>
                  <div className={styles.eventCell}>
                    <div className={styles.thumb} style={{ backgroundImage: event.gradient }}>
                      <TagIcon className={styles.thumbIcon} />
                    </div>
                    <div>
                      <p className={styles.eventName}>
                        {event.name} · {event.tour}
                      </p>
                      <p className={styles.eventCategory}>{event.category}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p className={styles.dateMain}>
                    {event.day} {event.month} {event.year}
                  </p>
                  <p className={styles.dateSub}>{event.time}</p>
                </td>
                <td>
                  <p className={styles.dateMain}>{event.venue}</p>
                  <p className={styles.dateSub}>{event.city}</p>
                </td>
                <td>
                  <p className={styles.strong}>{event.sold}</p>
                </td>
                <td>
                  <p className={styles.dateSub}>{event.capacity}</p>
                </td>
                <td>
                  <span className={styles.status} data-status={event.status}>
                    {statusLabels[event.status]}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" aria-label={`Ver ${event.name}`}>
                      <EyeIcon className={styles.actionIcon} />
                    </button>
                    <button type="button" aria-label={`Más opciones para ${event.name}`}>
                      <MoreIcon className={styles.actionIcon} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
