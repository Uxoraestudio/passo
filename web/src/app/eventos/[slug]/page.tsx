import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TicketSelector from "@/components/TicketSelector";
import styles from "./page.module.css";

const headliners = [
  { stage: "ESCENARIO BANCO DE CHILE", name: "Arctic Monkeys", tag: "Rock Alternativo · Headliner Viernes", note: "Set Especial 90 min" },
  { stage: "ESCENARIO CMPC", name: "Dua Lipa", tag: "Pop Vanguardista · Headliner Sábado", note: "Espectáculo Visual Exclusivo" },
  { stage: "ALTERNATIVE STAGE", name: "Justice", tag: "Electro Live · Cierre Domingo", note: "Sonido Envolvente Cuadrafónico" },
];

const lineupTags = ["Blink-182", "Lorde", "Rüfüs Du Sol", "Los Bunkers", "Mon Laferte", "Kidzapalooza (31 Minutos)"];

const schedule = [
  { time: "12:30", title: "Apertura Oficial de Puertas & Activaciones", place: "Acceso Parque Cerrillos · Ingreso expedito AFORIQ Fast-Pass", tag: "Todos los accesos" },
  { time: "15:00", title: "Bandas Emergentes & Indie Showcase", place: "Banco de Chile Stage & Perry's Stage", tag: "Live" },
  { time: "19:30", title: "Co-Headliners Sunset Session", place: "Alternative Stage & CMPC Stage", tag: "Golden Hour" },
  { time: "21:45", title: "Arctic Monkeys (Show Completo de Cierre)", place: "Escenario Principal Banco de Chile", tag: "Headliner", highlight: true },
];

const policies = [
  { title: "E-Ticket Dinámico AFORIQ", text: "Tu código QR se sincroniza y rota cada 30 segundos en la app oficial. Blindaje total contra capturas o fraudes." },
  { title: "Pulsera Inteligente Cashless", text: "Medio oficial de pago dentro del parque. Carga saldo anticipado y recibe 10% adicional de bonificación." },
  { title: "Nominación Obligatoria", text: "Cada entrada debe estar nominada con RUT o Pasaporte antes del 1 de marzo. 1 cambio de titular gratis hasta 72h antes." },
  { title: "Garantía Oficial de Devolución", text: "Protección respaldada por la Ley del Consumidor ante suspensión o reprogramación del evento." },
];

const faqs = [
  { q: "¿Cómo y cuándo recibo mi pulsera de acceso?", a: "Podrás optar por despacho a domicilio a partir de febrero de 2026 o retiro presencial en centros autorizados de Santiago presentando tu cédula y el voucher de compra." },
  { q: "¿Puedo ingresar con mi propia botella de agua?", a: "Sí. Se permite una botella reutilizable vacía de hasta 500cc para recargar en los puntos de hidratación gratuitos del parque." },
  { q: "¿Cuál es la política para menores de edad?", a: "Los niños de hasta 10 años ingresan gratis con un adulto responsable (máximo 2 por adulto). Registro obligatorio en Kidzapalooza." },
  { q: "¿Se reembolsa el saldo no utilizado en la pulsera?", a: "Sí, puedes solicitar la devolución del 100% de forma online hasta 15 días después del evento, sin comisión." },
];

export default function EventDetailPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Migas de pan">
          <span>Inicio</span>
          <span>/</span>
          <span>Festivales</span>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>Lollapalooza Chile 2026</span>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroImageWrap}>
            <Image
              src="/images/lollapalooza-hero.jpg"
              alt="Multitud en festival Lollapalooza Chile"
              fill
              priority
              sizes="100vw"
              className={styles.heroImage}
            />
            <div className={styles.heroGradient} />
          </div>
          <div className={styles.heroContent}>
            <div className={styles.badgeRow}>
              <span className={styles.badgePrimary}>
                <span className={styles.pulseDot} />
                Preventa Exclusiva Banco de Chile
              </span>
              <span className={styles.badgeGhost}>Fase 2 · 82% Vendido</span>
              <span className={styles.badgeGhost}>E-Ticket Nominativo Verificado</span>
            </div>
            <h1 className={styles.title}>
              Lollapalooza <span className={styles.titleAccent}>Chile 2026</span>
            </h1>
            <p className={styles.description}>
              3 jornadas épicas de música en vivo, vanguardia y cultura urbana en el Parque Bicentenario Cerrillos.
              Más de 100 bandas internacionales en 6 escenarios simultáneos.
            </p>
            <div className={styles.heroActions}>
              <a href="#entradas" className={styles.primaryAction}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 9V6.5a5 5 0 0110 0V9m-11 0h12a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Comprar Pases
              </a>
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
              <p className={styles.infoLabel}>FECHAS OFICIALES</p>
              <p className={styles.infoValue}>20 - 22 Marzo 2026</p>
              <p className={styles.infoSub}>Viernes, Sábado y Domingo</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={`${styles.infoIcon} ${styles.infoIconOrange}`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <p className={styles.infoLabel}>RECINTO &amp; CIUDAD</p>
              <p className={styles.infoValue}>Parque Cerrillos</p>
              <p className={styles.infoSub}>Santiago, Chile (Metro L6)</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={`${styles.infoIcon} ${styles.infoIconBlue}`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /></svg>
            </div>
            <div>
              <p className={styles.infoLabel}>APERTURA DE PUERTAS</p>
              <p className={styles.infoValue}>12:00 hrs</p>
              <p className={styles.infoSub}>Cierre estimado: 23:30 hrs</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={`${styles.infoIcon} ${styles.infoIconGreen}`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 2v8m0 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /></svg>
            </div>
            <div>
              <p className={styles.infoLabel}>RANGO DE PRECIOS</p>
              <p className={`${styles.infoValue} ${styles.infoValuePurple}`}>$68.000 - $340.000</p>
              <p className={styles.infoSub}>+ Cargo oficial por servicio</p>
            </div>
          </div>
        </section>

        <div className={styles.content}>
          <TicketSelector />

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

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionEyebrow}>
                <span className={styles.bracket}>[</span> Tu Experiencia Segura <span className={styles.bracket}>]</span>
              </div>
              <h2 className={styles.sectionTitle}>Políticas de Acceso &amp; Sistema Cashless</h2>
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
        </div>

        <div className={styles.stickyBar}>
          <div>
            <span className={styles.stickyLabel}>Desde</span>
            <span className={styles.stickyPrice}>$68.000</span>
          </div>
          <a href="#entradas" className={styles.stickyCta}>
            Ver entradas
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
