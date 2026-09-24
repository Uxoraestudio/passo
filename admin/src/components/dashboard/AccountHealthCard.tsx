import { MaterialIcon } from "@/components/icons";
import { accountHealthStats } from "@/lib/settings-data";
import styles from "./AccountHealthCard.module.css";

export default function AccountHealthCard() {
  return (
    <section className={styles.card}>
      <div className={styles.titleRow}>
        <MaterialIcon name="insights" className={styles.titleIcon} />
        <h3 className={styles.title}>Salud de la Cuenta</h3>
      </div>

      <div className={styles.statsBox}>
        {accountHealthStats.map((stat) => (
          <div key={stat.id} className={styles.statRow}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue} data-tone={stat.tone}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <MaterialIcon name="check_circle" className={styles.footerIcon} />
        <span>Contrato marco vigente hasta Noviembre 2026</span>
      </div>
    </section>
  );
}
