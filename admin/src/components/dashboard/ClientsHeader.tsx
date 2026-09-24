import { MaterialIcon } from "@/components/icons";
import styles from "./ClientsHeader.module.css";

export default function ClientsHeader() {
  return (
    <section className={styles.section}>
      <div>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>Comunidad · CRM AFORIQ</span>
          <span className={styles.badge}>Audiencia Activa</span>
        </div>
        <h1 className={styles.title}>Directorio de Clientes y Asistentes</h1>
        <p className={styles.subtitle}>Gestiona la base de datos de compradores, comportamiento de compra y segmentación en tiempo real.</p>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton}>
          <MaterialIcon name="ios_share" className={styles.secondaryIcon} />
          <span>Exportar Audiencia (CSV/Mailchimp)</span>
        </button>
        <button type="button" className={styles.primaryButton}>
          <MaterialIcon name="campaign" className={styles.primaryIcon} />
          <span>+ Crear Campaña de Fidelización</span>
        </button>
      </div>
    </section>
  );
}
