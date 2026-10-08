import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./LoginBrandPanel.module.css";

export default function LoginBrandPanel({
  handwritten = "La vida se vive aquí.",
  slogan = (
    <>
      TU LUGAR EN LO
      <br />
      EXTRAORDINARIO.
    </>
  ),
}: {
  handwritten?: ReactNode;
  slogan?: ReactNode;
}) {
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
        <p className={styles.handwritten}>{handwritten}</p>
        <div className={styles.dash} />
        <h2 className={styles.slogan}>{slogan}</h2>
      </div>
    </div>
  );
}
