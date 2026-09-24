import { MaterialIcon } from "@/components/icons";
import { actionAlerts } from "@/lib/reports-data";
import styles from "./ActionAlerts.module.css";

export default function ActionAlerts() {
  return (
    <div className={styles.grid}>
      {actionAlerts.map((alert) => (
        <div key={alert.id} className={styles.card}>
          <span className={styles.iconBox} data-tone={alert.tone}>
            <MaterialIcon name={alert.icon} className={styles.icon} />
          </span>
          <div>
            <h3 className={styles.title}>{alert.title}</h3>
            <p className={styles.description}>{alert.description}</p>
            <button type="button" className={styles.ctaButton} data-tone={alert.tone}>
              <span>{alert.ctaLabel}</span>
              <MaterialIcon name="arrow_forward" className={styles.ctaIcon} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
