import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/help/ContactForm";
import { createClient } from "@/lib/supabase/server";
import { isReason } from "@/lib/contact";
import styles from "../preguntas-frecuentes/page.module.css";
import contact from "./page.module.css";

export const metadata: Metadata = {
  title: "Contacto | Aforiq",
  description: "Escríbenos por compras, entradas, pagos o devoluciones y te responderemos por correo.",
  alternates: { canonical: "/contacto/" },
};

const quickAnswers = [
  { label: "¿Dónde recibo mis entradas?", href: "/preguntas-frecuentes/#donde-entradas" },
  { label: "No me llegó el correo con mis entradas", href: "/preguntas-frecuentes/#no-llego-correo" },
  { label: "¿Puedo pedir la devolución de mis entradas?", href: "/preguntas-frecuentes/#cuando-devolucion" },
  { label: "Olvidé mi contraseña", href: "/preguntas-frecuentes/#olvide-contrasena" },
];

export default async function ContactoPage({ searchParams }: PageProps<"/contacto">) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const fullName = ((claims?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "").trim();
  const [first, ...rest] = fullName ? fullName.split(/\s+/) : [""];

  return (
    <>
      <Header />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Migas de pan">
              <Link href="/">Inicio</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Contacto</span>
            </nav>
            <h1 className={styles.title}>
              Escríbenos, te <span>respondemos</span>
            </h1>
            <p className={styles.subtitle}>
              Cuéntanos tu consulta sobre una compra, tus entradas o tu cuenta y te contestaremos al correo que nos indiques.
            </p>
          </div>
        </section>

        <div className={contact.layout}>
          <ContactForm
            initial={{
              reason: isReason(query?.motivo) ? query.motivo : "",
              firstName: first ?? "",
              lastName: rest.join(" "),
              email: (claims?.email as string | undefined) ?? "",
            }}
          />

          <aside className={contact.aside}>
            <section className={contact.card} aria-labelledby="rapidas">
              <h2 id="rapidas">Respuestas rápidas</h2>
              <p>Quizás tu duda ya está resuelta.</p>
              <ul className={contact.quickList}>
                {quickAnswers.map((q) => (
                  <li key={q.href}>
                    <Link href={q.href}>
                      {q.label}
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/preguntas-frecuentes/" className={contact.allLink}>
                Ver todas las preguntas frecuentes →
              </Link>
            </section>

            <section className={contact.card} data-tone="dark" aria-labelledby="productores">
              <h2 id="productores">¿Eres productor?</h2>
              <p>Si quieres vender entradas para tu evento en Aforiq, escríbele a nuestro equipo de organizadores.</p>
              <a href="mailto:organizadores@aforiq.cl" className={contact.mailLink}>
                organizadores@aforiq.cl
              </a>
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
