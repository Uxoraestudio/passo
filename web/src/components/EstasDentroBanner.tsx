import Image from "next/image";
import styles from "./EstasDentroBanner.module.css";

export default function EstasDentroBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.background}>
        <Image
          src="/images/banner-crowd.jpg"
          alt=""
          fill
          sizes="100vw"
          className={styles.bgImage}
        />
        <div className={styles.bgGradient} />
      </div>
      <div className={styles.container}>
        <div className={styles.textColumn}>
          <span className={styles.eyebrow}>TUS ENTRADAS, SIEMPRE CONTIGO.</span>
          <h2 className={styles.heading}>
            Estás <span className={styles.accent}>dentro.</span>
          </h2>
          <p className={styles.description}>
            Entradas digitales, seguras y al instante.
            <br />
            Más experiencias. Más personas. Más historias.
          </p>
          <a href="#" className={styles.cta}>
            <span>Descubrir eventos</span>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M11.6667 4.16667L17.5 10M17.5 10L11.6667 15.8333M17.5 10H2.5"
                stroke="white"
                strokeWidth="2.08333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
        <div className={styles.graphicColumn}>
          <div className={styles.bracketBox}>
            <div className={styles.bracket} data-side="left" aria-hidden="true" />
            <p className={styles.handwritten}>
              Diferentes
              <br />
              escenarios.
              <br />
              La misma
              <br />
              emoción.
            </p>
            <div className={styles.bracket} data-side="right" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
