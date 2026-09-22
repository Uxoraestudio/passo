import { MaterialIcon } from "@/components/icons";
import styles from "./ValidEntryBanner.module.css";

export default function ValidEntryBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.left}>
        <span className={styles.checkIcon}>
          <MaterialIcon name="check_circle" className={styles.checkIconGlyph} />
        </span>
        <div>
          <div className={styles.metaRow}>
            <span className={styles.badge}>ENTRADA VÁLIDA</span>
            <span className={styles.metaText}>19:42:15 hrs • Puerta A-2</span>
          </div>
          <p className={styles.name}>Christyan Montiel — RUT: 18.492.301-4</p>
          <p className={styles.details}>Platea Preferencial • Fila A • Asiento 12 • TKT-890241-NX</p>
        </div>
      </div>
      <div className={styles.right}>
        <span className={styles.grantedPill}>Acceso Concedido</span>
        <button type="button" className={styles.infoButton} aria-label="Ver detalle de la entrada">
          <MaterialIcon name="info" className={styles.infoIcon} />
        </button>
      </div>
    </div>
  );
}
