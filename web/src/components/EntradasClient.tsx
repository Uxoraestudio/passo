"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VenueMap from "@/components/VenueMap";
import type { EventCardData } from "@/lib/events";
import type { EventDetail } from "@/lib/eventDetails";
import styles from "@/app/eventos/[slug]/entradas/page.module.css";

const MAX_TICKETS = 4;
const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;

export default function EntradasClient({
  event,
  detail,
  slug,
  initialTier,
  initialQty,
}: {
  event: EventCardData;
  detail: EventDetail;
  slug: string;
  initialTier: string | null;
  initialQty: number;
}) {
  const router = useRouter();

  const [selections, setSelections] = useState<Record<string, number>>(() => {
    if (initialTier && initialQty > 0) {
      return { [initialTier]: Math.min(initialQty, MAX_TICKETS) };
    }
    return {};
  });

  const totalQty = useMemo(() => Object.values(selections).reduce((a, b) => a + b, 0), [selections]);

  const updateQty = (tierId: string, delta: number) => {
    setSelections((prev) => {
      const current = prev[tierId] ?? 0;
      const next = current + delta;
      if (next < 0) return prev;
      if (delta > 0 && totalQty >= MAX_TICKETS) return prev;
      const updated = { ...prev, [tierId]: next };
      if (next === 0) delete updated[tierId];
      return updated;
    });
  };

  const activeIds = Object.keys(selections).filter((id) => selections[id] > 0);
  const lines = detail.tiers
    .filter((tier) => (selections[tier.id] ?? 0) > 0)
    .map((tier) => ({ tier, qty: selections[tier.id] }));

  const subtotal = lines.reduce((sum, line) => sum + line.tier.price * line.qty, 0);
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;

  const handleContinue = () => {
    const numberedLine = lines.find((line) => line.tier.numbered);
    if (numberedLine) {
      router.push(`/eventos/${slug}/asientos?sector=${numberedLine.tier.id}&qty=${numberedLine.qty}`);
    } else {
      router.push(`/proximamente?title=${encodeURIComponent("Confirmación de compra")}`);
    }
  };

  return (
    <main className={styles.main}>
      <Link href={`/eventos/${slug}`} className={styles.backLink}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Volver al evento
      </Link>

      <section className={styles.banner}>
        <div className={styles.bannerText}>
          <span className={styles.bannerEyebrow}>{detail.primaryBadge}</span>
          <h1 className={styles.bannerTitle}>
            Elige tus <span className={styles.bannerAccent}>[ entradas ]</span>
          </h1>
          <p className={styles.bannerSub}>Selección oficial certificada para {event.venue}.</p>
        </div>
        <div className={styles.bannerCard}>
          <div className={styles.bannerThumb}>
            <Image src={event.image} alt={event.alt} fill sizes="56px" className={styles.bannerImage} />
          </div>
          <div>
            <p className={styles.bannerEventName}>
              {event.title} · {event.subtitle}
            </p>
            <p className={styles.bannerMeta}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {detail.dateLabel} · {detail.doorsOpen}
            </p>
            <p className={styles.bannerMeta}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {event.venue}, {event.city}
            </p>
          </div>
        </div>
      </section>

      <div className={styles.layout}>
        <div className={styles.content}>
          <section className={styles.mapCard}>
            <div className={styles.mapHeader}>
              <div>
                <h2>Mapa Interactivo del Recinto</h2>
                <p>Haz clic en un sector del plano o selecciónalo en la lista inferior.</p>
              </div>
            </div>
            <div className={styles.mapWrap}>
              <VenueMap tiers={detail.tiers} activeIds={activeIds} onSelect={(id) => updateQty(id, (selections[id] ?? 0) > 0 ? 0 : 1)} />
            </div>
            <div className={styles.legend}>
              {detail.tiers.map((tier) => (
                <div key={tier.id} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: tier.color }} />
                  {tier.name}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sectorCard}>
            <div className={styles.sectorHeader}>
              <h2>Selecciona tu sector</h2>
              <span>Máximo {MAX_TICKETS} entradas por transacción para este evento.</span>
            </div>
            <div className={styles.sectorList}>
              {detail.tiers.map((tier) => {
                const qty = selections[tier.id] ?? 0;
                return (
                  <div key={tier.id} className={styles.sectorRow} data-active={qty > 0}>
                    <div className={styles.sectorInfo}>
                      <span className={styles.sectorDot} style={{ background: tier.color }} />
                      <div>
                        <div className={styles.sectorNameRow}>
                          <span className={styles.sectorName}>{tier.name}</span>
                          {tier.badge && <span className={styles.sectorBadge}>{tier.badge}</span>}
                        </div>
                        <span className={tier.status === "pocas" ? styles.statusLow : styles.statusOk}>
                          {tier.status === "pocas" ? "Pocas unidades" : "Disponible"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.sectorPrice}>
                      <span>{currency(tier.price)}</span>
                      <small>+ cargo por servicio</small>
                    </div>
                    <div className={styles.stepper}>
                      <button type="button" onClick={() => updateQty(tier.id, -1)} disabled={qty === 0} aria-label={`Restar ${tier.name}`}>
                        −
                      </button>
                      <span>{qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(tier.id, 1)}
                        disabled={totalQty >= MAX_TICKETS}
                        aria-label={`Sumar ${tier.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className={styles.summary}>
          <div className={styles.summaryHeader}>
            <h2>Resumen de tu orden</h2>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 100-4V7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>

          <div className={styles.summaryEvent}>
            <div className={styles.summaryThumb}>
              <Image src={event.image} alt={event.alt} fill sizes="48px" className={styles.bannerImage} />
            </div>
            <div>
              <p>
                {event.title} · {event.subtitle}
              </p>
              <span>
                {event.venue} · {detail.dateLabel.split(" ").slice(0, 2).join(" ")}
              </span>
            </div>
          </div>

          {lines.length === 0 ? (
            <p className={styles.emptySummary}>Selecciona un sector para ver el resumen de tu compra.</p>
          ) : (
            <div className={styles.summaryLines}>
              {lines.map(({ tier, qty }) => (
                <div key={tier.id} className={styles.summaryLine}>
                  <span>
                    {qty}x {tier.name}
                    <small>{currency(tier.price)} c/u</small>
                  </span>
                  <span>{currency(tier.price * qty)}</span>
                </div>
              ))}
              <div className={styles.summaryLine}>
                <span>Cargo por servicio (10%)</span>
                <span>{currency(fee)}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>Costo emisión E-Ticket</span>
                <span className={styles.free}>GRATIS</span>
              </div>
            </div>
          )}

          <div className={styles.summaryTotal}>
            <div>
              <span>Monto Total a pagar</span>
              <small>Impuestos y tasas incluidos</small>
            </div>
            <strong>{currency(total)}</strong>
          </div>

          <button type="button" className={styles.continueButton} disabled={lines.length === 0} onClick={handleContinue}>
            Continuar Compra
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M11.6667 4.16667L17.5 10M17.5 10L11.6667 15.8333M17.5 10H2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <Link href={`/eventos/${slug}`} className={styles.backToEvent}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver al evento
          </Link>

          <div className={styles.guarantee}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <div>
              <p>Garantía oficial Passo</p>
              <span>Tickets 100% auténticos con código QR dinámico antifraude, intransferible hasta el día del evento.</span>
            </div>
          </div>
        </aside>
      </div>

      {lines.length > 0 && (
        <div className={styles.mobileBar}>
          <div>
            <span>
              {totalQty} entrada{totalQty > 1 ? "s" : ""}
            </span>
            <strong>{currency(total)}</strong>
          </div>
          <button type="button" onClick={handleContinue}>
            Continuar
          </button>
        </div>
      )}
    </main>
  );
}
