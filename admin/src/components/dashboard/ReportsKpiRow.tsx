import { MaterialIcon } from "@/components/icons";
import { reportsKpis } from "@/lib/reports-data";
import styles from "./ReportsKpiRow.module.css";

export default function ReportsKpiRow() {
  return (
    <div className={styles.grid}>
      {reportsKpis.map((kpi) => (
        <div key={kpi.id} className={styles.card}>
          <div className={styles.header}>
            <span className={styles.label}>{kpi.label}</span>
            <span className={styles.iconBox} data-tone={kpi.tone}>
              <MaterialIcon name={kpi.icon} className={styles.icon} />
            </span>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{kpi.value}</span>
            <span className={styles.valueSuffix}>{kpi.valueSuffix}</span>
          </div>
          {kpi.footerKind === "pill" ? (
            <div className={styles.footer}>
              <span className={styles.pill}>
                {kpi.pillIcon ? <MaterialIcon name={kpi.pillIcon} className={styles.pillIcon} /> : null}
                {kpi.pillLabel}
              </span>
              {kpi.captionText ? <span className={styles.captionText}>{kpi.captionText}</span> : null}
            </div>
          ) : (
            <div className={styles.progressFooter}>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${kpi.progressPercent}%` }} />
              </div>
              <span className={styles.progressLabel}>{kpi.progressLabel}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
