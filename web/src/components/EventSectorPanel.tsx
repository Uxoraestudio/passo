import Link from "next/link";
import type { ReactNode } from "react";
import type { TicketTier } from "@/lib/eventDetails";
import VenueMap from "@/components/VenueMap";
import pageStyles from "@/app/eventos/[slug]/page.module.css";
import styles from "./EventSectorPanel.module.css";

const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;

export default function EventSectorPanel({
  tiers,
  slug,
  aboutLead,
  aboutText,
  children,
}: {
  tiers: TicketTier[];
  slug: string;
  aboutLead: string;
  aboutText: string[];
  children?: ReactNode;
}) {
  const prices = tiers.map((tier) => tier.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = minPrice === maxPrice ? currency(minPrice) : `${currency(minPrice)} - ${currency(maxPrice)}`;

  return (
    <div className={pageStyles.layout}>
      <div className={pageStyles.content}>
        <section className={pageStyles.sectionCard}>
          <div className={pageStyles.sectionHeader}>
            <div className={pageStyles.sectionEyebrow}>
              <span className={pageStyles.bracket}>[</span> Vista Referencial <span className={pageStyles.bracket}>]</span>
            </div>
            <h2 className={pageStyles.sectionTitle}>Mapa del Recinto</h2>
            <p className={pageStyles.sectionSubtitle}>
              Ubicación referencial de cada sector. Elegirás tu sector en el siguiente paso.
            </p>
          </div>
          <div className={pageStyles.venueMapWrap}>
            <VenueMap tiers={tiers} interactive={false} />
          </div>
          <div className={pageStyles.legend}>
            {tiers.map((tier) => (
              <div key={tier.id}>
                <span className={pageStyles.legendDot} style={{ background: tier.color }} />
                {tier.name}
              </div>
            ))}
          </div>
        </section>

        <section className={pageStyles.sectionCard}>
          <div className={pageStyles.sectionHeader}>
            <div className={pageStyles.sectionEyebrow}>
              <span className={pageStyles.bracket}>[</span> Sobre el evento <span className={pageStyles.bracket}>]</span>
            </div>
            <h2 className={pageStyles.sectionTitle}>{aboutLead}</h2>
          </div>
          {aboutText.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className={pageStyles.aboutText}>
              {paragraph}
            </p>
          ))}
        </section>

        {children}
      </div>

      <aside className={pageStyles.sidebar}>
        <section className={styles.card}>
          <div className={styles.header}>
            <div>
              <div className={styles.eyebrow}>
                <span className={styles.bracket}>[</span>
                VENTA ACTIVA OFICIAL
                <span className={styles.bracket}>]</span>
              </div>
              <h2 className={styles.title}>Sectores y precios</h2>
            </div>
          </div>

          <p className={styles.hint}>Valores referenciales por entrada. Elige tu sector y cantidad en el siguiente paso.</p>

          <div className={styles.tiers}>
            {tiers.map((tier) => (
              <div key={tier.id} className={styles.tier}>
                <div className={styles.tierBody}>
                  <div className={styles.tierTop}>
                    <span className={styles.tierColorDot} style={{ background: tier.color }} aria-hidden="true" />
                    <span className={styles.tierName}>{tier.name}</span>
                    {tier.badge && <span className={styles.tierBadge}>{tier.badge}</span>}
                    <span className={tier.status !== "disponible" ? styles.badgeLow : styles.badgeOk}>
                      {tier.status === "agotado" ? "Agotado" : tier.status === "pocas" ? "Pocas un." : "Disponible"}
                    </span>
                  </div>
                </div>
                <div className={styles.tierPrice}>
                  <span>{currency(tier.price)}</span>
                  <small>+ cargo por servicio</small>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.rangeRow}>
            <span>Rango de precios</span>
            <strong>{priceRange}</strong>
          </div>

          <Link href={`/eventos/${slug}/entradas`} className={styles.cta}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M5 9V6.5a5 5 0 0110 0V9m-11 0h12a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1z"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Comprar Tickets
          </Link>

          <p className={styles.paymentNote}>
            Precios referenciales sujetos a disponibilidad. Aceptamos Webpay Plus, Redcompra, Débito y Crédito en hasta 6
            cuotas sin interés.
          </p>
        </section>

        <div className={pageStyles.assistCard}>
          <div className={pageStyles.assistIcon}>
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
            <p className={pageStyles.assistTitle}>¿Necesitas asistencia?</p>
            <p className={pageStyles.assistText}>Atención telefónica y WhatsApp 24/7 de nuestro Concierge de Eventos.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
