import { MaterialIcon } from "@/components/icons";
import styles from "./ConfigHeader.module.css";

export default function ConfigHeader() {
  return (
    <section className={styles.section}>
      <div>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>Gestión de Cuenta</span>
          <span className={styles.dot} />
          <span className={styles.eyebrowAccent}>Producción Activa</span>
        </div>
        <h1 className={styles.title}>Configuración de la Productora</h1>
        <p className={styles.subtitle}>Ajustes generales, datos de facturación, pasarelas de pago y políticas de eventos</p>
      </div>

      <div className={styles.verificationBadge}>
        <span className={styles.verificationLeft}>
          <MaterialIcon name="verified" className={styles.verificationIcon} />
          <span>Verificación Tributaria SII</span>
        </span>
        <span className={styles.verificationDivider}>|</span>
        <span className={styles.verificationId}>ID: PROD-CL-9921</span>
      </div>
    </section>
  );
}
