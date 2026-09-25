import Image from "next/image";
import Link from "next/link";
import styles from "./OrganizersBanner.module.css";

const keywords = ["EVENTOS", "PERSONAS", "CULTURA", "COMUNIDAD"];

export default function OrganizersBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.background}>
        <Image
          src="/images/organizers-atmosphere.jpg"
          alt=""
          fill
          sizes="100vw"
          className={styles.bgImage}
        />
        <div className={styles.bgGradient} />
      </div>
      <div className={styles.container}>
        <div className={styles.textColumn}>
          <span className={styles.eyebrow}>HAGAMOS GRANDES HISTORIAS JUNTOS.</span>
          <h2 className={styles.heading}>
            ¿Organizas
            <br />
            <span className={styles.accent}>eventos?</span>
          </h2>
          <p className={styles.description}>
            Llega a más personas y vive la experiencia AFORIQ.
            <br />
            Nosotros nos encargamos de la tecnología, tú de la magia.
          </p>
          <Link href="/organizadores" className={styles.cta}>
            <span>Publica tu evento</span>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M11.6667 4.16667L17.5 10M17.5 10L11.6667 15.8333M17.5 10H2.5"
                stroke="white"
                strokeWidth="2.08333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
        <div className={styles.graphicColumn}>
          <div className={styles.hoodieBox}>
            <Image
              src="/images/organizers-hoodie.jpg"
              alt="Hoodie con la marca Passo"
              fill
              sizes="256px"
              className={styles.hoodieImage}
            />
            <div className={styles.hoodieOverlay} />
            <div className={styles.hoodieContent}>
              <span className={styles.bracketGlyph}>[</span>
              <span className={styles.hoodieText}>
                LA VIDA
                <br />
                SE VIVE
                <br />
                AQUÍ.
              </span>
              <span className={styles.bracketGlyph}>]</span>
            </div>
          </div>
          <div className={styles.typeStack}>
            <div className={styles.keywords}>
              {keywords.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </div>
            <div className={styles.tagline}>
              <span className={styles.divider} aria-hidden="true" />
              <p>
                TU LUGAR
                <br />
                EN LO
                <br />
                EXTRAORDINARIO.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
