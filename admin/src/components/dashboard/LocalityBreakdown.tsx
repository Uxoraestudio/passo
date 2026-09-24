import { localitySegments } from "@/lib/reports-data";
import styles from "./LocalityBreakdown.module.css";

export default function LocalityBreakdown() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ingresos por Localidad</h2>
        <span className={styles.caption}>Distribución Tiers</span>
      </div>

      <div className={styles.stackedBar}>
        {localitySegments.map((segment) => (
          <div key={segment.id} className={styles.stackedSegment} style={{ width: `${segment.percent}%`, background: segment.color }} title={`${segment.label}: ${segment.percent}%`} />
        ))}
      </div>

      <div className={styles.grid}>
        {localitySegments.map((segment) => (
          <div key={segment.id} className={styles.row}>
            <span className={styles.rowLeft}>
              <span className={styles.dot} style={{ background: segment.color }} />
              {segment.label}
            </span>
            <span className={styles.amount}>{segment.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
