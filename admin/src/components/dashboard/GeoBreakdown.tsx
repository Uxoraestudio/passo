import { geoSegments } from "@/lib/reports-data";
import styles from "./GeoBreakdown.module.css";

export default function GeoBreakdown() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Geografía de Audiencia</h2>
        <span className={styles.badge}>3 Regiones Clave</span>
      </div>
      <p className={styles.subtitle}>Concentración geográfica de compradores verificados vía RUT/Passport.</p>

      <div className={styles.list}>
        {geoSegments.map((segment) => (
          <div key={segment.id}>
            <div className={styles.rowHeader}>
              <span className={styles.rowLabel}>{segment.label}</span>
              <span className={styles.rowValue} data-emphasis={segment.emphasis}>
                {segment.percent}%
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${segment.percent}%`, background: segment.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
