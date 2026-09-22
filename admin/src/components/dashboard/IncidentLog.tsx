import { MaterialIcon } from "@/components/icons";
import { incidentLog } from "@/lib/qr-validation-data";
import styles from "./IncidentLog.module.css";

export default function IncidentLog() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.headerLeft}>
          <MaterialIcon name="warning" className={styles.headerIcon} />
          <h2 className={styles.title}>Registro en Vivo de Incidencias</h2>
        </span>
        <span className={styles.countBadge}>38 Registros</span>
      </div>

      <div className={styles.list}>
        {incidentLog.map((item) => (
          <div key={item.id} className={styles.item}>
            <span className={styles.itemIconBox}>
              <MaterialIcon name={item.icon} className={styles.itemIcon} />
            </span>
            <div className={styles.itemText}>
              <div className={styles.itemTitleRow}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemCode}>{item.code}</span>
              </div>
              <p className={styles.itemDescription}>{item.description}</p>
            </div>
            <div className={styles.itemMeta}>
              <span className={styles.itemTime}>{item.time}</span>
              <span className={styles.itemTerminal}>{item.terminal}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
