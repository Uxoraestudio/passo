import { MaterialIcon } from "@/components/icons";
import styles from "./ValidationKpiRow.module.css";

export default function ValidationKpiRow() {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.blob} data-tone="purple" />
        <div className={styles.header}>
          <span className={styles.label}>Aforo Ingresado</span>
          <span className={styles.iconBox} data-tone="purple">
            <MaterialIcon name="groups" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value}>4.286</span>
            <span className={styles.valueSuffix}>/ 6.482</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} data-tone="purple" style={{ width: "66.1%" }} />
          </div>
        </div>
        <div className={styles.footer}>
          <span className={styles.footerLabel}>66.1% de ocupación</span>
          <span className={styles.footerValue} data-tone="purple">
            2.196 remanentes
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.blob} data-tone="teal" />
        <div className={styles.header}>
          <span className={styles.label}>Escaneos Exitosos</span>
          <span className={styles.iconBox} data-tone="teal">
            <MaterialIcon name="verified" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value}>4.286</span>
            <span className={styles.deltaPill} data-tone="teal">
              99.1%
            </span>
          </div>
          <p className={styles.captionText}>Sin demoras en torniquetes</p>
        </div>
        <div className={styles.trendFooter}>
          <MaterialIcon name="bolt" className={styles.trendIcon} />
          <span>+18.4% respecto al show anterior</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.blob} data-tone="danger" />
        <div className={styles.header}>
          <span className={styles.label}>Rechazos / Duplicados</span>
          <span className={styles.iconBox} data-tone="danger">
            <MaterialIcon name="gpp_maybe" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value} data-tone="danger">
              38
            </span>
            <span className={styles.deltaPill} data-tone="danger">
              Alerta Antifraude
            </span>
          </div>
          <p className={styles.captionText}>29 duplicadas • 9 anuladas</p>
        </div>
        <div className={styles.footer}>
          <span className={styles.footerValue} data-tone="danger">
            Revisión de incidentes activa
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.blob} data-tone="orange" />
        <div className={styles.header}>
          <span className={styles.label}>Ritmo de Entrada</span>
          <span className={styles.iconBox} data-tone="orange">
            <MaterialIcon name="speed" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value}>42</span>
            <span className={styles.valueSuffix}>escaneos/min</span>
          </div>
          <p className={styles.captionText}>Pico de flujo en Puerta Norte</p>
        </div>
        <div className={styles.trendFooter} data-tone="orange">
          <MaterialIcon name="local_fire_department" className={styles.trendIcon} />
          <span>Flujo sostenido en accesos VIP</span>
        </div>
      </div>
    </div>
  );
}
