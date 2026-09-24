import { MaterialIcon } from "@/components/icons";
import styles from "./SalesHeader.module.css";

export default function SalesHeader() {
  return (
    <section className={styles.section}>
      <div>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>Módulo Financiero • Productora VIP</span>
          <span className={styles.liveDot} />
          <span className={styles.liveCaption}>En vivo</span>
        </div>
        <h1 className={styles.title}>Control de Ventas y Transacciones</h1>
        <p className={styles.subtitle}>Monitorea en tiempo real los ingresos, pedidos y flujo de fondos de tus eventos.</p>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton}>
          <MaterialIcon name="account_balance" className={styles.secondaryIcon} />
          <span>Conciliación bancaria</span>
        </button>
        <button type="button" className={styles.primaryButton}>
          <MaterialIcon name="download" className={styles.primaryIcon} />
          <span>Descargar reporte contable (CSV/Excel)</span>
        </button>
      </div>
    </section>
  );
}
