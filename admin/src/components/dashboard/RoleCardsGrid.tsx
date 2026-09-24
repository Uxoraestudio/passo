import { MaterialIcon } from "@/components/icons";
import { roleCards } from "@/lib/roles-data";
import styles from "./RoleCardsGrid.module.css";

export default function RoleCardsGrid() {
  return (
    <div className={styles.grid}>
      {roleCards.map((role) => (
        <div key={role.id} className={styles.card}>
          <div className={styles.header}>
            <span className={styles.iconBox} data-tone={role.tone}>
              <MaterialIcon name={role.icon} className={styles.icon} />
            </span>
            <span className={styles.memberPill}>
              <MaterialIcon name="group" className={styles.memberIcon} />
              {role.memberCount} miembros
            </span>
          </div>
          <h3 className={styles.title}>{role.title}</h3>
          <p className={styles.description}>{role.description}</p>
          <div className={styles.footer}>
            <span className={styles.levelLabel}>{role.levelLabel}</span>
            <button type="button" className={styles.matrixLink}>
              Ver matriz
              <MaterialIcon name="arrow_forward" className={styles.matrixIcon} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
