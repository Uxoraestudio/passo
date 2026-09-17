import Image from "next/image";
import styles from "./LoginBrandPanel.module.css";

export default function LoginBrandPanel() {
  return (
    <div className={styles.panel}>
      <Image
        src="/images/login-brand.jpg"
        alt=""
        fill
        sizes="(max-width: 900px) 0px, 50vw"
        className={styles.image}
      />
      <div className={styles.gradient} />
      <div className={styles.brackets} aria-hidden="true">
        <div className={styles.bracket} data-side="left" />
        <div className={styles.bracket} data-side="right" />
      </div>
      <div className={styles.taglines}>
        <p className={styles.handwritten}>La vida se vive aquí.</p>
        <div className={styles.dash} />
        <h2 className={styles.slogan}>
          TU LUGAR EN LO
          <br />
          EXTRAORDINARIO.
        </h2>
      </div>
    </div>
  );
}
