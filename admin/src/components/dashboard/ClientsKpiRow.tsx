import { MaterialIcon } from "@/components/icons";
import { clientsKpis } from "@/lib/clients-data";
import styles from "./ClientsKpiRow.module.css";

export default function ClientsKpiRow() {
  return (
    <div className={styles.grid}>
      {clientsKpis.map((kpi) => (
        <div key={kpi.id} className={styles.card}>
          {kpi.tone === "orange" ? <div className={styles.blob} /> : null}
          <div className={styles.header}>
            <span className={styles.label}>{kpi.label}</span>
            <span className={styles.iconBox} data-tone={kpi.tone ?? "purple"}>
              <MaterialIcon name={kpi.icon} className={styles.icon} />
            </span>
          </div>
          <div>
            <div className={styles.valueRow}>
              <span className={styles.value} data-tone={kpi.tone}>
                {kpi.value}
              </span>
              {kpi.valueSuffix ? <span className={styles.valueSuffix}>{kpi.valueSuffix}</span> : null}
            </div>
            {kpi.deltaLabel ? (
              <div className={styles.footer}>
                <span className={styles.deltaPill}>
                  <MaterialIcon name={kpi.deltaIcon ?? "trending_up"} className={styles.deltaIcon} />
                  {kpi.deltaLabel}
                </span>
                <span className={styles.captionText}>{kpi.captionText}</span>
              </div>
            ) : (
              <p className={styles.plainCaption}>{kpi.captionText}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
