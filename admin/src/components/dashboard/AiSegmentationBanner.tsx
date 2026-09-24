import { MaterialIcon } from "@/components/icons";
import styles from "./AiSegmentationBanner.module.css";

export default function AiSegmentationBanner() {
  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <span className={styles.iconBox}>
          <MaterialIcon name="smart_toy" className={styles.icon} />
        </span>
        <div>
          <h3 className={styles.title}>Segmentación Predictiva de Audiencia con IA</h3>
          <p className={styles.subtitle}>
            Hay 1.240 compradores con un 88% de propensión a comprar tickets para la segunda fecha de &apos;Luna Nova&apos;.
          </p>
        </div>
      </div>
      <button type="button" className={styles.ctaButton}>
        <MaterialIcon name="bolt" className={styles.ctaIcon} />
        <span>Lanzar Preventa Exclusiva</span>
      </button>
    </div>
  );
}
