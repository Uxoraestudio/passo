import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FaqBrowser from "@/components/help/FaqBrowser";
import { FAQ_CATEGORIES } from "@/lib/faqs";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | Aforiq",
  description: "Resuelve tus dudas sobre compras, pagos, entradas, tu cuenta y devoluciones en Aforiq.",
  alternates: { canonical: "/preguntas-frecuentes/" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_CATEGORIES.flatMap((c) =>
    c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a.join(" ") },
    }))
  ),
};

export default function PreguntasFrecuentesPage() {
  return (
    <>
      <Header />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Migas de pan">
              <Link href="/">Inicio</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Preguntas frecuentes</span>
            </nav>
            <h1 className={styles.title}>
              ¿En qué te <span>ayudamos</span>?
            </h1>
            <p className={styles.subtitle}>Respuestas rápidas sobre compras, pagos, entradas y tu cuenta.</p>
          </div>
        </section>

        <FaqBrowser categories={FAQ_CATEGORIES} />

        <section className={styles.cta} aria-labelledby="cta-title">
          <div>
            <h2 id="cta-title">¿No encontraste tu respuesta?</h2>
            <p>Escríbenos y te responderemos al correo que nos indiques.</p>
          </div>
          <Link href="/contacto/" className={styles.ctaButton}>
            Ir a contacto
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.3 8h9.4M8.7 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
