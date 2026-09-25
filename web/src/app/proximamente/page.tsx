import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default async function ProximamentePage({ searchParams }: PageProps<"/proximamente">) {
  const params = await searchParams;
  const titleParam = params?.title;
  const title = Array.isArray(titleParam) ? titleParam[0] : titleParam;

  return (
    <>
      <Header />
      <main className={styles.main}>
        <span className={styles.eyebrow}>Muy pronto</span>
        <h1 className={styles.title}>{title || "Esta sección"} está en camino</h1>
        <p className={styles.description}>
          Todavía estamos construyendo esta página. Mientras tanto, sigue explorando los eventos
          disponibles en Passo.
        </p>
        <Link href="/eventos" className={styles.action}>
          Ver eventos
        </Link>
      </main>
      <Footer />
    </>
  );
}
