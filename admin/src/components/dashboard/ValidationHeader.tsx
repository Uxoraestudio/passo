import { MaterialIcon } from "@/components/icons";
import styles from "./ValidationHeader.module.css";

export default function ValidationHeader() {
  return (
    <section className={styles.section}>
      <div>
        <div className={styles.liveRow}>
          <span className={styles.liveDot} />
          <span className={styles.liveLabel}>En Tiempo Real</span>
          <span className={styles.liveCaption}>• Sistema AFORIQ Gateway v4.2</span>
        </div>
        <h1 className={styles.title}>Control de Acceso y Validación QR en Vivo</h1>
      </div>

      <div className={styles.eventRow}>
        <button type="button" className={styles.eventPill}>
          <MaterialIcon name="confirmation_number" className={styles.eventIcon} />
          <span>Luna Nova • Prisma Tour — En Curso</span>
          <MaterialIcon name="expand_more" className={styles.chevronIcon} />
        </button>
        <div className={styles.statusPill}>
          <span className={styles.statusDot} />
          <span>ONLINE</span>
          <span className={styles.statusDivider}>•</span>
          <span>Latencia: 24ms</span>
          <span className={styles.statusDivider}>•</span>
          <span>12 terminales</span>
        </div>
      </div>
    </section>
  );
}
