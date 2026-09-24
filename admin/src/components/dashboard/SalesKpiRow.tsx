import { MaterialIcon } from "@/components/icons";
import { salesKpis } from "@/lib/sales-data";
import styles from "./SalesKpiRow.module.css";

export default function SalesKpiRow() {
  return (
    <div className={styles.grid}>
      {salesKpis.map((kpi) => (
        <div key={kpi.id} className={styles.card}>
          <div className={styles.blob} data-tone={kpi.tone} />
          <div className={styles.header}>
            <span className={styles.label}>{kpi.label}</span>
            <span className={styles.iconBox} data-tone={kpi.tone}>
              <MaterialIcon name={kpi.icon} className={styles.icon} />
            </span>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{kpi.value}</span>
            {kpi.valueSuffix ? <span className={styles.valueSuffix}>{kpi.valueSuffix}</span> : null}
          </div>
          <div className={styles.footer}>
            <span className={styles.deltaPill} data-tone={kpi.deltaTone}>
              <MaterialIcon name={kpi.deltaIcon} className={styles.deltaIcon} />
              {kpi.deltaLabel}
            </span>
            <span className={styles.captionText}>{kpi.captionText}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
