import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TERMS_INTRO, TERMS_SECTIONS, TERMS_UPDATED, type LegalBlock } from "@/lib/legal/terminos";
import hero from "../preguntas-frecuentes/page.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Términos y condiciones | Aforiq",
  description: "Términos y condiciones de compra de entradas en Aforiq.",
  alternates: { canonical: "/terminos-y-condiciones/" },
};

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className={block.ordered ? styles.ordered : styles.bullets}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Tag>
      );
    }
    case "lines":
      return (
        <div className={styles.lines}>
          {block.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      );
    case "checks":
      return (
        <ul className={styles.checks}>
          {block.items.map((item) => (
            <li key={item}>
              <span className={styles.checkBox} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      );
  }
}

export default function TerminosPage() {
  return (
    <>
      <Header />
      <main>
        <section className={hero.hero}>
          <div className={hero.heroInner}>
            <nav className={hero.breadcrumb} aria-label="Migas de pan">
              <Link href="/">Inicio</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Términos y condiciones</span>
            </nav>
            <h1 className={hero.title}>
              Términos y <span>condiciones</span>
            </h1>
            <p className={hero.subtitle}>Condiciones de compra de entradas en Aforiq. Última actualización: {TERMS_UPDATED}.</p>
          </div>
        </section>

        <div className={styles.layout}>
          <nav className={styles.toc} aria-label="Índice">
            <p className={styles.tocTitle}>Índice</p>
            <ol>
              {TERMS_SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span>{i + 1}.</span> {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className={styles.doc}>
            <div className={styles.intro}>
              {TERMS_INTRO.map((t) => (
                <p key={t.slice(0, 32)}>{t}</p>
              ))}
            </div>

            {TERMS_SECTIONS.map((s, i) => (
              <section key={s.id} id={s.id} className={styles.section} aria-labelledby={`${s.id}-t`}>
                <h2 id={`${s.id}-t`}>
                  <span className={styles.num}>{i + 1}</span>
                  {s.title}
                </h2>
                {s.blocks.map((b, j) => (
                  <Block key={j} block={b} />
                ))}
              </section>
            ))}

            <aside className={styles.help}>
              <p>¿Tienes dudas sobre estas condiciones?</p>
              <Link href="/contacto/">Escríbenos →</Link>
            </aside>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
