import { MaterialIcon } from "@/components/icons";
import { bankAccount, settlementItems } from "@/lib/settings-data";
import styles from "./SettlementCard.module.css";

export default function SettlementCard() {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <MaterialIcon name="account_balance" className={styles.titleIcon} />
          <h3 className={styles.title}>Liquidación Bancaria</h3>
        </div>
        <span className={styles.liveDot} />
      </div>
      <p className={styles.subtitle}>Cuenta principal habilitada para transferencias de abonos y rendiciones periódicas.</p>

      <div className={styles.bankCard}>
        <div className={styles.bankHeader}>
          <div className={styles.bankNameRow}>
            <MaterialIcon name="account_balance" className={styles.bankIcon} />
            <span className={styles.bankName}>{bankAccount.bankName}</span>
          </div>
          <span className={styles.validatedBadge}>{bankAccount.status}</span>
        </div>
        <div className={styles.accountBlock}>
          <span className={styles.accountLabel}>{bankAccount.accountType}</span>
          <span className={styles.accountNumber}>{bankAccount.accountMasked}</span>
        </div>
        <div className={styles.bankFooter}>
          <div>
            <span className={styles.bankFooterLabel}>Titular Registrado</span>
            <span className={styles.bankFooterValue}>{bankAccount.holder}</span>
          </div>
          <div className={styles.bankFooterRight}>
            <span className={styles.bankFooterLabel}>RUT</span>
            <span className={styles.bankFooterValueMono}>{bankAccount.rut}</span>
          </div>
        </div>
      </div>

      <h4 className={styles.frequencyTitle}>Frecuencia de Liquidación</h4>
      <div className={styles.itemsList}>
        {settlementItems.map((item) => (
          <div key={item.id} className={styles.item}>
            <MaterialIcon name={item.icon} className={styles.itemIcon} />
            <div>
              <span className={styles.itemTitle}>{item.title}</span>
              <p className={styles.itemDescription}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className={styles.addAccountButton}>
        <MaterialIcon name="add_card" className={styles.addAccountIcon} />
        <span>Añadir Cuenta Secundaria</span>
      </button>
    </section>
  );
}
