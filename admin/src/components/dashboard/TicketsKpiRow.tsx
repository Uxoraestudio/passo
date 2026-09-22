import { MaterialIcon } from "@/components/icons";
import styles from "./TicketsKpiRow.module.css";

export default function TicketsKpiRow() {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.blob} data-tone="purple" />
        <div className={styles.header}>
          <span className={styles.label}>Tickets Emitidos</span>
          <span className={styles.iconBox} data-tone="purple">
            <MaterialIcon name="confirmation_number" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value}>6.482</span>
            <span className={styles.valueSuffix}>/ 8.000 max</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} data-tone="purple" style={{ width: "81.025%" }} />
          </div>
        </div>
        <div className={styles.footer}>
          <span className={styles.footerLabel}>Aforo configurado</span>
          <span className={styles.footerValue} data-tone="purple">
            1.518 remanentes
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.blob} data-tone="orange" />
        <div className={styles.header}>
          <span className={styles.label}>Ocupación Bruta</span>
          <span className={styles.iconBox} data-tone="orange">
            <MaterialIcon name="percent" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value} data-tone="orange">
              81.0%
            </span>
            <span className={styles.deltaPill}>+4.2% hoy</span>
          </div>
          <p className={styles.captionText}>Ritmo: 24 entradas/hora</p>
        </div>
        <div className={styles.trendFooter}>
          <MaterialIcon name="trending_up" className={styles.trendIcon} />
          <span>Velocidad óptima para Sold Out</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.blob} data-tone="teal" />
        <div className={styles.header}>
          <span className={styles.label}>Cortesías &amp; Prensa</span>
          <span className={styles.iconBox} data-tone="teal">
            <MaterialIcon name="badge" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value}>140</span>
            <span className={styles.valueSuffix}>validadas</span>
          </div>
          <p className={styles.captionText}>Límite asignado: 200 credenciales</p>
        </div>
        <div className={styles.footer}>
          <span className={styles.footerLabel}>Cupo restante VIP</span>
          <span className={styles.footerValue} data-tone="teal">
            60 libretas
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.blob} data-tone="neutral" />
        <div className={styles.header}>
          <span className={styles.label}>Bloqueos Técnicos / FOH</span>
          <span className={styles.iconBox} data-tone="neutral">
            <MaterialIcon name="lock_person" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value}>80</span>
            <span className={styles.valueSuffix}>butacas</span>
          </div>
          <p className={styles.captionText}>Visual tapada / Consolas de audio</p>
        </div>
        <div className={styles.footer}>
          <span className={styles.footerLabel}>Liberación estimada</span>
          <span className={styles.footerValue} data-tone="neutral">
            Día T - 4 horas
          </span>
        </div>
      </div>
    </div>
  );
}
