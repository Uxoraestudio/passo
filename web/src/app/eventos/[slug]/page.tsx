import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TicketSelector from "@/components/TicketSelector";
import EventCard from "@/components/EventCard";
import { allEvents, eventBySlug } from "@/lib/events";
import { eventDetails, genericFaqs, genericPolicies } from "@/lib/eventDetails";
import styles from "./page.module.css";

const headliners = [
  { stage: "ESCENARIO BANCO DE CHILE", name: "Arctic Monkeys", tag: "Rock Alternativo · Headliner Viernes", note: "Set Especial 90 min" },
  { stage: "ESCENARIO CMPC", name: "Dua Lipa", tag: "Pop Vanguardista · Headliner Sábado", note: "Espectáculo Visual Exclusivo" },
  { stage: "ALTERNATIVE STAGE", name: "Justice", tag: "Electro Live · Cierre Domingo", note: "Sonido Envolvente Cuadrafónico" },
];

const lineupTags = ["Blink-182", "Lorde", "Rüfüs Du Sol", "Los Bunkers", "Mon Laferte", "Kidzapalooza (31 Minutos)"];

const schedule = [
  { time: "12:30", title: "Apertura Oficial de Puertas & Activaciones", place: "Acceso Parque Cerrillos · Ingreso expedito Fast-Pass", tag: "Todos los accesos" },
  { time: "15:00", title: "Bandas Emergentes & Indie Showcase", place: "Banco de Chile Stage & Perry's Stage", tag: "Live" },
  { time: "19:30", title: "Co-Headliners Sunset Session", place: "Alternative Stage & CMPC Stage", tag: "Golden Hour" },
  { time: "21:45", title: "Arctic Monkeys (Show Completo de Cierre)", place: "Escenario Principal Banco de Chile", tag: "Headliner", highlight: true },
];

const lollapaloozaPolicies = [
  { title: "E-Ticket Dinámico Passo", text: "Tu código QR se sincroniza y rota cada 30 segundos en la app oficial. Blindaje total contra capturas o fraudes." },
  { title: "Pulsera Inteligente Cashless", text: "Medio oficial de pago dentro del parque. Carga saldo anticipado y recibe 10% adicional de bonificación." },
  { title: "Nominación Obligatoria", text: "Cada entrada debe estar nominada con RUT o Pasaporte antes del 1 de marzo. 1 cambio de titular gratis hasta 72h antes." },
  { title: "Garantía Oficial de Devolución", text: "Protección respaldada por la Ley del Consumidor ante suspensión o reprogramación del evento." },
];

const transport = [
  {
    title: "Metro Línea 6",
    text: "Estación terminal Cerrillos a pasos del recinto. Frecuencia reforzada hasta las 01:00 AM en días de evento.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="16" height="13" rx="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="8" cy="20" r="1.4" fill="currentColor" />
        <circle cx="16" cy="20" r="1.4" fill="currentColor" />
        <path d="M4 11h16" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "Bicicleteamientos",
    text: "Más de 1.000 cupos cuidados y gratuitos para tu bicicleta. Llega según tu propio horario y sin buscar estacionamiento.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="6" cy="17" r="3.2" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="17" r="3.2" stroke="currentColor" strokeWidth="2" />
        <path d="M6 17 10 8h4l4 9M10 8 8.5 5h2.5M6 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Parking Oficial",
    text: "Cupos limitados con reserva previa en la app oficial. Te recomendamos carpooling por lo eficiente de la ruta.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M9 16V8h3.5a2.5 2.5 0 010 5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const lollapaloozaFaqs = [
  { q: "¿Cómo y cuándo recibo mi pulsera de acceso?", a: "Podrás optar por despacho a domicilio a partir de febrero de 2026 o retiro presencial en centros autorizados de Santiago presentando tu cédula y el voucher de compra." },
  { q: "¿Puedo ingresar con mi propia botella de agua?", a: "Sí. Se permite una botella reutilizable vacía de hasta 500cc para recargar en los puntos de hidratación gratuitos del parque." },
  { q: "¿Cuál es la política para menores de edad?", a: "Los niños de hasta 10 años ingresan gratis con un adulto responsable (máximo 2 por adulto). Registro obligatorio en Kidzapalooza." },
  { q: "¿Se reembolsa el saldo no utilizado en la pulsera?", a: "Sí, puedes solicitar la devolución del 100% de forma online hasta 15 días después del evento, sin comisión." },
];

const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;

export function generateStaticParams() {
  return allEvents.filter((event) => event.slug).map((event) => ({ slug: event.slug as string }));
}

export default async function EventDetailPage({ params }: PageProps<"/eventos/[slug]">) {
  const { slug } = await params;
  const event = eventBySlug(slug);
  const detail = event ? eventDetails[event.id] : undefined;

  if (!event || !detail) {
    notFound();
  }

  const isLollapalooza = event.id === "lollapalooza";
  const heroImage = isLollapalooza ? "/images/lollapalooza-hero.jpg" : event.image;
  const prices = detail.tiers.map((tier) => tier.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = minPrice === maxPrice ? currency(minPrice) : `${currency(minPrice)} - ${currency(maxPrice)}`;
  const policies = isLollapalooza ? lollapaloozaPolicies : genericPolicies;
  const faqs = isLollapalooza ? lollapaloozaFaqs : genericFaqs;
  const relatedEvents = allEvents.filter((e) => e.id !== event.id).slice(0, 4);

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.breadcrumbRow}>
          <nav className={styles.breadcrumb} aria-label="Migas de pan">
            <span>Inicio</span>
            <span>/</span>
            <span>{detail.breadcrumbCategory}</span>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>{event.title}</span>
          </nav>
          <span className={styles.confirmedBadge}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M16.667 5 7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Evento Oficial Confirmado
          </span>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroImageWrap}>
            <Image src={heroImage} alt={event.alt} fill priority sizes="100vw" className={styles.heroImage} />
            <div className={styles.heroGradient} />
          </div>
          <div className={styles.heroContent}>
            <div className={styles.badgeRow}>
              <span className={styles.badgePrimary}>
                <span className={styles.pulseDot} />
                {detail.primaryBadge}
              </span>
              {detail.badges.map((badge) => (
                <span key={badge} className={styles.badgeGhost}>
                  {badge}
                </span>
              ))}
            </div>
            <h1 className={styles.title}>{event.title}</h1>
            <p className={styles.description}>{event.subtitle}</p>
            <div className={styles.heroActions}>
              <Link href={`/eventos/${slug}/entradas`} className={styles.primaryAction}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 9V6.5a5 5 0 0110 0V9m-11 0h12a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Comprar Entradas
              </Link>
              <button type="button" className={styles.ghostAction} aria-label="Guardar en favoritos">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" className={styles.ghostAction} aria-label="Compartir evento">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M8.684 13.342a4.5 4.5 0 100-2.684m0 2.684 6.632 3.316m-6.632-6 6.632-3.316m0 0a4.5 4.5 0 108.98-.492 4.5 4.5 0 00-8.98.492zm8.98 8.492a4.5 4.5 0 10-8.98.492 4.5 4.5 0 008.98-.492z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        <section className={styles.infoRibbon}>
          <div className={styles.infoItem}>
            <div className={`${styles.infoIcon} ${styles.infoIconPurple}`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <p className={styles.infoLabel}>FECHA OFICIAL</p>
              <p className={styles.infoValue}>{detail.dateLabel}</p>
              <p className={styles.infoSub}>{detail.dateSub}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={`${styles.infoIcon} ${styles.infoIconOrange}`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <p className={styles.infoLabel}>RECINTO &amp; CIUDAD</p>
              <p className={styles.infoValue}>{event.venue}</p>
              <p className={styles.infoSub}>{event.city}, Chile</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={`${styles.infoIcon} ${styles.infoIconBlue}`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /></svg>
            </div>
            <div>
              <p className={styles.infoLabel}>APERTURA DE PUERTAS</p>
              <p className={styles.infoValue}>{detail.doorsOpen}</p>
              <p className={styles.infoSub}>Cierre estimado: {detail.doorsClose}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={`${styles.infoIcon} ${styles.infoIconGreen}`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 2v8m0 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /></svg>
            </div>
            <div>
              <p className={styles.infoLabel}>RANGO DE PRECIOS</p>
              <p className={`${styles.infoValue} ${styles.infoValuePurple}`}>{priceRange}</p>
              <p className={styles.infoSub}>+ Cargo oficial por servicio</p>
            </div>
          </div>
        </section>

        <div className={styles.layout}>
          <div className={styles.content}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionEyebrow}>
                <span className={styles.bracket}>[</span> Sobre el evento <span className={styles.bracket}>]</span>
              </div>
              <h2 className={styles.sectionTitle}>{detail.aboutLead}</h2>
            </div>
            {detail.aboutText.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className={styles.aboutText}>
                {paragraph}
              </p>
            ))}
          </section>

          {isLollapalooza && (
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionEyebrow}>
                  <span className={styles.bracket}>[</span> Artistas Confirmados <span className={styles.bracket}>]</span>
                </div>
                <h2 className={styles.sectionTitle}>Lineup &amp; Experiencia del Festival</h2>
              </div>
              <div className={styles.headlinerScroll}>
                {headliners.map((h) => (
                  <div key={h.name} className={styles.headlinerCard}>
                    <span className={styles.headlinerStage}>{h.stage}</span>
                    <h3>{h.name}</h3>
                    <p>{h.tag}</p>
                    <span className={styles.headlinerNote}>{h.note}</span>
                  </div>
                ))}
              </div>
              <p className={styles.tagCloudLabel}>DESTACADOS POR GÉNERO Y FORMATO</p>
              <div className={styles.tagCloud}>
                {lineupTags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </section>
          )}

          {isLollapalooza && (
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionEyebrow}>
                  <span className={styles.bracket}>[</span> Planifica tu ruta <span className={styles.bracket}>]</span>
                </div>
                <h2 className={styles.sectionTitle}>Horarios y Cronograma Oficial</h2>
              </div>
              <div className={styles.dayTabs}>
                <span className={styles.dayTabActive}>Viernes 20 Mar</span>
                <span className={styles.dayTab}>Sábado 21 Mar</span>
                <span className={styles.dayTab}>Domingo 22 Mar</span>
              </div>
              <div className={styles.timeline}>
                {schedule.map((item) => (
                  <div key={item.time} className={`${styles.timelineItem} ${item.highlight ? styles.timelineHighlight : ""}`}>
                    <div className={styles.timelineTime}>{item.time}</div>
                    <div className={styles.timelineBody}>
                      <h4>{item.title}</h4>
                      <p>{item.place}</p>
                    </div>
                    <span className={item.highlight ? styles.timelineTagHighlight : styles.timelineTag}>{item.tag}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {isLollapalooza && (
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionEyebrow}>
                  <span className={styles.bracket}>[</span> Orientación en Terreno <span className={styles.bracket}>]</span>
                </div>
                <h2 className={styles.sectionTitle}>Mapa Oficial del Recinto &amp; Sectores</h2>
              </div>
              <div className={styles.mapWrap}>
                <Image src="/images/lollapalooza-map.jpg" alt="Mapa del recinto Parque Bicentenario de Cerrillos" fill sizes="100vw" className={styles.mapImage} />
                <div className={styles.mapGradient} />
                <div className={styles.mapOverlay}>
                  <span className={styles.mapBadge}>DISTRIBUCIÓN 2026</span>
                  <p className={styles.mapTitle}>Parque Bicentenario de Cerrillos</p>
                  <p className={styles.mapSub}>Accesos integrados por Estación Intermodal Metro Cerrillos (Línea 6)</p>
                </div>
              </div>
              <div className={styles.legend}>
                <div><span className={styles.legendDotPurple} />Escenarios Principales</div>
                <div><span className={styles.legendDotOrange} />Lolla Lounge VIP</div>
                <div><span className={styles.legendDotTeal} />Puntos de Hidratación</div>
                <div><span className={styles.legendDotBlue} />Accesos PMR &amp; Salud</div>
              </div>
            </section>
          )}

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionEyebrow}>
                <span className={styles.bracket}>[</span> Tu Experiencia Segura <span className={styles.bracket}>]</span>
              </div>
              <h2 className={styles.sectionTitle}>Políticas de Acceso{isLollapalooza ? " & Sistema Cashless" : ""}</h2>
            </div>
            <div className={styles.policyGrid}>
              {policies.map((p) => (
                <div key={p.title} className={styles.policyItem}>
                  <h4>{p.title}</h4>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionEyebrow}>
                <span className={styles.bracket}>[</span> Resolvemos tus dudas <span className={styles.bracket}>]</span>
              </div>
              <h2 className={styles.sectionTitle}>Preguntas Frecuentes</h2>
            </div>
            <div className={styles.faqList}>
              {faqs.map((f) => (
                <details key={f.q} className={styles.faqItem}>
                  <summary>
                    {f.q}
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {isLollapalooza && (
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionEyebrow}>
                  <span className={styles.bracket}>[</span> Plan de movilidad <span className={styles.bracket}>]</span>
                </div>
                <h2 className={styles.sectionTitle}>Cómo Llegar &amp; Transporte Conectado</h2>
              </div>
              <div className={styles.transportGrid}>
                {transport.map((item) => (
                  <div key={item.title} className={styles.transportItem}>
                    <div className={styles.transportIcon}>{item.icon}</div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          </div>

          <aside className={styles.sidebar}>
            <TicketSelector key={slug} tiers={detail.tiers} slug={slug} />
            <div className={styles.assistCard}>
              <div className={styles.assistIcon}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M8.5 12.5a3.5 3.5 0 117 0M12 3a9 9 0 00-9 9v3a2 2 0 002 2h1v-6H5a7 7 0 0114 0h-1v6h1a2 2 0 002-2v-3a9 9 0 00-9-9z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p className={styles.assistTitle}>¿Necesitas asistencia?</p>
                <p className={styles.assistText}>Atención telefónica y WhatsApp 24/7 de nuestro Concierge de Eventos.</p>
              </div>
            </div>
          </aside>
        </div>

        <section className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <div className={styles.sectionEyebrow}>
              <span className={styles.bracket}>[</span> Cartelera en vivo <span className={styles.bracket}>]</span>
            </div>
            <h2 className={styles.sectionTitle}>Otros Eventos que te pueden interesar</h2>
          </div>
          <div className={styles.relatedGrid}>
            {relatedEvents.map((relatedEvent) => (
              <EventCard key={relatedEvent.id} event={relatedEvent} />
            ))}
          </div>
        </section>

        <div className={styles.stickyBar}>
          <div>
            <span className={styles.stickyLabel}>Desde</span>
            <span className={styles.stickyPrice}>{currency(minPrice)}</span>
          </div>
          <Link href={`/eventos/${slug}/entradas`} className={styles.stickyCta}>
            Ver entradas
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
