import { MaterialIcon } from "@/components/icons";
import styles from "./HelpDeskBar.module.css";

export default function HelpDeskBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.iconBox}>
          <MaterialIcon name="support_agent" className={styles.icon} />
        </span>
        <div>
          <p className={styles.title}>Mesa de Ayuda de Accesos y Seguridad</p>
          <p className={styles.subtitle}>Canal de radio UHF CH-4 • Coordinador general: Fernando Silva (+56 9 88321190)</p>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton}>
          <MaterialIcon name="download" className={styles.buttonIcon} />
          <span>Descargar Log CSV</span>
        </button>
        <button type="button" className={styles.primaryButton}>
          <MaterialIcon name="sync_lock" className={styles.buttonIcon} />
          <span>Re-sincronizar Claves</span>
        </button>
      </div>
    </div>
  );
}
