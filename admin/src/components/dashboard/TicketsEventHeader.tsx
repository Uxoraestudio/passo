import { MaterialIcon } from "@/components/icons";
import styles from "./TicketsEventHeader.module.css";

export default function TicketsEventHeader() {
  return (
    <section className={styles.section}>
      <div>
        <div className={styles.liveRow}>
          <span className={styles.liveDot} />
          <span className={styles.liveLabel}>Consola de Operaciones en Vivo</span>
          <span className={styles.liveCaption}>• Producción Arena Santiago</span>
        </div>
        <h1 className={styles.title}>Gestión de Entradas y Aforo</h1>
        <p className={styles.subtitle}>
          Control de dispersión de tickets, rendimiento por fase y asignación de contingente técnico en tiempo real.
        </p>
      </div>

      <div className={styles.eventRow}>
        <div className={styles.eventPill}>
          <span className={styles.eventIconBox}>
            <MaterialIcon name="stadium" className={styles.eventIcon} />
          </span>
          <div className={styles.eventInfo}>
            <span className={styles.eventEyebrow}>Evento en curso</span>
            <span className={styles.eventTitle}>Luna Nova • Prisma Tour</span>
            <span className={styles.eventCaption}>Movistar Arena • 24 Nov 2024</span>
          </div>
          <button type="button" className={styles.swapButton} aria-label="Cambiar evento">
            <MaterialIcon name="swap_horiz" className={styles.swapIcon} />
          </button>
        </div>
        <button type="button" className={styles.syncButton}>
          <MaterialIcon name="refresh" className={styles.syncIcon} />
          <span>Sincronizar Pasarela</span>
        </button>
      </div>
    </section>
  );
}
