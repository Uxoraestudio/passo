import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function OrganizadoresPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <span className={styles.eyebrow}>Para organizadores</span>
        <h1 className={styles.title}>
          Publica tu evento en <span className={styles.accent}>Passo</span>
        </h1>
        <p className={styles.description}>
          Estamos preparando el flujo de autoservicio para que las productoras puedan crear y
          vender entradas directamente desde acá. Mientras tanto, escríbenos y te ayudamos a
          publicar tu evento manualmente.
        </p>
        <div className={styles.actions}>
          <a href="mailto:organizadores@passo.cl" className={styles.primaryAction}>
            Escribir a organizadores@passo.cl
          </a>
          <Link href="/eventos" className={styles.secondaryAction}>
            Ver eventos publicados
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
