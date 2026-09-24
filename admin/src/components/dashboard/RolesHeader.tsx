import { MaterialIcon } from "@/components/icons";
import styles from "./RolesHeader.module.css";

export default function RolesHeader() {
  return (
    <section className={styles.section}>
      <div>
        <span className={styles.eyebrow}>Gobernanza &amp; Seguridad Operativa</span>
        <h1 className={styles.title}>Equipo, Roles y Permisos</h1>
        <p className={styles.subtitle}>
          Control de accesos y responsabilidades para los miembros de tu organización de eventos. Define atribuciones críticas desde
          torniquetes hasta liquidaciones bancarias.
        </p>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton}>
          <MaterialIcon name="fact_check" className={styles.secondaryIcon} />
          <span>Log de Auditoría</span>
        </button>
        <button type="button" className={styles.primaryButton}>
          <MaterialIcon name="person_add" className={styles.primaryIcon} />
          <span>+ Invitar nuevo miembro</span>
        </button>
      </div>
    </section>
  );
}
