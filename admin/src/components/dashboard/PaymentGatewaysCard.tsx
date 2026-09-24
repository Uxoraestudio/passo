import { MaterialIcon } from "@/components/icons";
import { paymentGateways } from "@/lib/settings-data";
import styles from "./PaymentGatewaysCard.module.css";

export default function PaymentGatewaysCard() {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <MaterialIcon name="hub" className={styles.titleIcon} />
            <h2 className={styles.title}>Integración de Pasarelas de Pago</h2>
          </div>
          <p className={styles.subtitle}>Gestione los procesadores directos para el flujo de cobros de boletería</p>
        </div>
        <span className={styles.badge}>2 Conectadas</span>
      </div>

      <div className={styles.list}>
        {paymentGateways.map((gateway) => (
          <div key={gateway.id} className={styles.row}>
            <div className={styles.rowLeft}>
              <span className={styles.iconBox}>
                <MaterialIcon name={gateway.icon} className={styles.icon} style={{ color: gateway.iconColor }} />
              </span>
              <div>
                <div className={styles.nameRow}>
                  <h4 className={styles.name}>{gateway.name}</h4>
                  <span className={styles.statusPill}>
                    <span className={styles.statusDot} />
                    {gateway.statusLabel}
                  </span>
                </div>
                <p className={styles.description}>{gateway.description}</p>
              </div>
            </div>
            <div className={styles.rowActions}>
              <button type="button" className={styles.actionButton}>
                {gateway.actionLabel}
              </button>
              <button type="button" className={styles.iconButton}>
                <MaterialIcon name={gateway.secondaryIcon} className={styles.iconButtonGlyph} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
