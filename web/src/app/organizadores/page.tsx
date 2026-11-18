import type { Metadata } from "next";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProducerForm from "@/components/producers/ProducerForm";
import { getSeoPage } from "@/lib/seo-settings";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoPage("organizadores");
  const title = seo.metaTitle || "Vende tus entradas con Aforiq | Productores";
  const description =
    seo.metaDescription || "Crea tu evento en Aforiq: panel propio, planos con asientos numerados, preventas, cupones y validación QR en la puerta.";

  return {
    title,
    description,
    alternates: { canonical: "/organizadores/" },
    openGraph: {
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: seo.ogImageUrl ? [seo.ogImageUrl] : [],
    },
  };
}

const icon = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;

const features = [
  {
    title: "Tu propio panel",
    text: "Crea y edita tus eventos, sectores y precios cuando quieras. Lo que cambias se ve en el sitio al instante.",
    svg: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" {...icon} />
        <path d="M3.5 9h17M8 13h4M8 16h7" {...icon} />
      </>
    ),
  },
  {
    title: "Planos con asientos",
    text: "Dibuja el plano de tu recinto con sectores, zonas de precio y asientos numerados o accesibles.",
    svg: (
      <>
        <path d="M5 8h14M7 12h10M9 16h6" {...icon} />
        <path d="M8 4.5h8" {...icon} />
      </>
    ),
  },
  {
    title: "Preventas y cupones",
    text: "Vende por etapas con cupos por sector y crea cupones de descuento para tus campañas.",
    svg: (
      <>
        <path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2V8Z" {...icon} />
        <path d="M10 9.5 14 14.5M10.5 14h.01M13.5 10h.01" {...icon} />
      </>
    ),
  },
  {
    title: "Entradas nominativas",
    text: "Si tu evento lo necesita, cada entrada queda a nombre de su asistente con RUT o pasaporte.",
    svg: (
      <>
        <circle cx="12" cy="9" r="3.5" {...icon} />
        <path d="M5 19.5c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5" {...icon} />
      </>
    ),
  },
  {
    title: "Validación QR en la puerta",
    text: "Tu equipo de acceso escanea los QR desde el celular y ve en tiempo real quién entró.",
    svg: (
      <>
        <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" {...icon} />
        <path d="M8 12h8" {...icon} />
      </>
    ),
  },
  {
    title: "Ventas y reportes",
    text: "Sigue tus ventas, asistentes y recaudación por evento y por sector, sin planillas.",
    svg: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...icon} />
      </>
    ),
  },
];

const steps = [
  { title: "Envía tu solicitud", text: "Completa el formulario con tus datos y los de tu evento." },
  { title: "Te contactamos", text: "Nuestro equipo revisa tu solicitud y conversa contigo las condiciones." },
  { title: "Activamos tu productora", text: "Te damos acceso al panel con tu cuenta Aforiq y el rol de productor." },
  { title: "Publica y vende", text: "Crea tu evento, configura tus sectores y empieza a vender." },
];

const producerFaqs = [
  {
    q: "¿Qué pasa después de enviar el formulario?",
    a: "Revisamos tu solicitud y te contactamos al correo o teléfono que indicaste. Cuando acordemos las condiciones, creamos tu productora y te damos acceso al panel.",
  },
  {
    q: "¿Necesito una cuenta Aforiq?",
    a: "Sí. Te damos acceso al panel de productores con el correo de tu cuenta Aforiq, así que conviene que envíes el formulario con ese mismo correo. Si aún no tienes cuenta, puedes crearla gratis.",
  },
  {
    q: "¿Tiene costo vender entradas con Aforiq?",
    a: "Las condiciones comerciales dependen de tu evento. Te las contamos cuando te contactemos, antes de activar tu productora.",
  },
  {
    q: "¿Puedo sumar a mi equipo?",
    a: "Sí. Desde el panel puedes dar acceso a tu equipo, por ejemplo al personal que valida las entradas en la puerta.",
  },
  {
    q: "¿Qué tipos de eventos puedo publicar?",
    a: "Conciertos, festivales, teatro, stand-up, deportes, fiestas, ferias y eventos corporativos, con entradas generales o asientos numerados.",
  },
];

export default async function OrganizadoresPage() {
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
          <Image src="/images/organizers-atmosphere.jpg" alt="" fill priority sizes="100vw" className={styles.heroImage} />
          <div className={styles.heroShade} />
          <div className={styles.heroInner}>
            <h1 className={styles.title}>
              Crea tu evento y véndelo con <span>Aforiq</span>
            </h1>
            <p className={styles.lead}>
              Una ticketera chilena con panel propio para productores: planos con asientos, preventas, cupones y validación QR en la puerta.
            </p>
            <div className={styles.heroActions}>
              <a href="#solicitud" className={styles.primary}>
                Quiero vender con Aforiq
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 3.5v13m0 0 5-5m-5 5-5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href="#como-funciona" className={styles.ghost}>
                ¿Cómo funciona?
              </a>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="herramientas">
          <div className={styles.sectionHead}>
            <h2 id="herramientas">Todo lo que necesitas para vender</h2>
            <p>Herramientas pensadas para el día a día de una productora, del primer anuncio hasta la puerta.</p>
          </div>
          <ul className={styles.features}>
            {features.map((f) => (
              <li key={f.title} className={styles.feature}>
                <span className={styles.featureIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24">{f.svg}</svg>
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="como-funciona" className={styles.howBand} aria-labelledby="como-funciona-titulo">
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="como-funciona-titulo">Así empiezas</h2>
              <p>Cuatro pasos entre tu solicitud y tu evento a la venta.</p>
            </div>
            <ol className={styles.steps}>
              {steps.map((s, i) => (
                <li key={s.title}>
                  <span className={styles.stepNumber}>{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="solicitud" className={styles.formBand} aria-labelledby="solicitud-titulo">
          <div className={styles.formLayout}>
            <div className={styles.formIntro}>
              <h2 id="solicitud-titulo">
                Hablemos de tu <span>evento</span>
              </h2>
              <p>Completa el formulario y te contactaremos para activar tu productora en Aforiq.</p>
              <ul className={styles.checks}>
                <li>Te contactamos para conversar las condiciones</li>
                <li>Te damos acceso con tu cuenta Aforiq</li>
                <li>Creas y administras tus eventos desde tu panel</li>
              </ul>
            </div>
            <ProducerForm
              initial={{ firstName: first ?? "", lastName: rest.join(" "), email: (claims?.email as string | undefined) ?? "", signedIn: Boolean(claims?.sub) }}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="dudas">
          <div className={styles.sectionHead}>
            <h2 id="dudas">¿Aún tienes dudas?</h2>
          </div>
          <div className={styles.faqs}>
            {producerFaqs.map((f) => (
              <details key={f.q} className={styles.faq}>
                <summary>
                  {f.q}
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <p className={styles.mailNote}>
            ¿Prefieres escribirnos? <a href="mailto:organizadores@aforiq.cl">organizadores@aforiq.cl</a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
