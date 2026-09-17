import Image from "next/image";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <Image
          src="/images/hero-concierto.jpg"
          alt="Experiencia de concierto en vivo"
          fill
          priority
          sizes="100vw"
          className={styles.image}
        />
        <div className={styles.gradient} />
      </div>
    </section>
  );
}
