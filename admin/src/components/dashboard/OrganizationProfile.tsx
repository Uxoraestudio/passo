import { MaterialIcon } from "@/components/icons";
import { profileFields } from "@/lib/settings-data";
import styles from "./OrganizationProfile.module.css";

export default function OrganizationProfile() {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <MaterialIcon name="corporate_fare" className={styles.titleIcon} />
            <h2 className={styles.title}>Perfil de la Productora</h2>
          </div>
          <p className={styles.subtitle}>Información corporativa legal requerida para contratos y facturación electrónica</p>
        </div>
        <span className={styles.badge}>Oficial y Público</span>
      </div>

      <div className={styles.logoRow}>
        <div className={styles.logoWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/aforiq-logo.jpg" alt="Logotipo AFORIQ" className={styles.logoImg} />
          <span className={styles.logoCheck}>
            <MaterialIcon name="check" className={styles.logoCheckIcon} />
          </span>
        </div>
        <div className={styles.logoText}>
          <h3 className={styles.logoTitle}>Logotipo Oficial de Eventos</h3>
          <p className={styles.logoDescription}>
            Este logo se imprimirá en los e-tickets PDF, correos de confirmación y en la cabecera del portal de ventas checkout.
          </p>
          <div className={styles.logoActions}>
            <button type="button" className={styles.uploadButton}>
              <MaterialIcon name="upload" className={styles.uploadIcon} />
              <span>Cambiar logo</span>
            </button>
            <span className={styles.logoHint}>Formatos PNG o SVG con fondo transparente. Máx 3MB.</span>
          </div>
        </div>
      </div>

      <div className={styles.fieldsGrid}>
        {profileFields.map((field) => (
          <label key={field.id} className={styles.field}>
            <span className={styles.fieldLabel}>{field.label}</span>
            <span className={styles.fieldInputWrap}>
              <MaterialIcon name={field.icon} className={styles.fieldIcon} />
              <input type={field.type} defaultValue={field.value} className={styles.fieldInput} data-mono={field.mono} />
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
