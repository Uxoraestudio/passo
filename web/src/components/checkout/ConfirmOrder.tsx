"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { CheckoutOrder } from "@/lib/checkout-order";
import { payOrder } from "@/lib/checkout-client";
import CheckoutTopBar from "./CheckoutTopBar";
import OrderSummary, { HelpCard, currency } from "./OrderSummary";
import styles from "./Checkout.module.css";

export default function ConfirmOrder({ order }: { order: CheckoutOrder }) {
  const [accepted, setAccepted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [expired, setExpired] = useState(!order.editable);
  const onExpire = useCallback(() => setExpired(true), []);

  const detailsHref = `/compra/${order.id}/datos/`;
  const retryHref = `/eventos/${order.event.slug}/entradas/`;
  const quantity = order.slots.length;

  const pay = async () => {
    if (!accepted || paying || expired) return;
    setPaying(true);
    setError(null);
    const result = await payOrder(order.id);
    if (!result.ok) {
      setError({ message: result.error, code: result.code });
      if (result.code === "ORDER_EXPIRED") setExpired(true);
      setPaying(false);
    }
  };

  const payLabel = paying ? "Conectando con Flow…" : `Pagar ${currency(order.total)} CLP`;

  return (
    <main className={styles.main}>
      <CheckoutTopBar current={2} expiresAt={order.editable ? order.expiresAt : undefined} serverNow={order.serverNow} onExpire={onExpire} />

      <div className={styles.layout}>
        <div className={styles.content}>
          <Link href={detailsHref} className={styles.backLink}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M8.3 4.2 2.5 10m0 0 5.8 5.8M2.5 10h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver a tus datos
          </Link>

          <header className={styles.pageHeader}>
            <span className={styles.stepTag}>Paso 03 de 04</span>
            <h1 className={styles.pageTitle}>Revisa y confirma tu orden</h1>
            <p className={styles.pageSubtitle}>Verifica que los datos de los asistentes y tus entradas sean correctos antes de pagar.</p>
          </header>

          {expired && (
            <div className={styles.alert} role="alert">
              <p>
                <strong>Tu reserva venció.</strong> Las entradas se liberaron para otros compradores.
              </p>
              <Link href={retryHref}>Elegir entradas de nuevo</Link>
            </div>
          )}

          <section className={styles.eventStrip} aria-label="Evento">
            <span className={styles.dateTile}>
              <small>{order.event.month}</small>
              {order.event.day}
            </span>
            <div className={styles.eventStripInfo}>
              {order.event.subtitle && <span className={styles.kickerChip}>{order.event.subtitle}</span>}
              <p className={styles.eventStripTitle}>{order.event.title}</p>
              <p className={styles.eventStripMeta}>
                <span>
                  {order.event.dateLong} a las {order.event.time} hrs
                </span>
                <span>
                  {order.event.venue}, {order.event.city}
                </span>
              </p>
            </div>
            <p className={styles.eventStripCount}>
              <small>Entradas</small>
              {quantity}
            </p>
          </section>

          <section className={styles.card} aria-labelledby="attendees-title">
            <div className={styles.cardHeaderRow}>
              <h2 id="attendees-title" className={styles.cardTitle}>
                Asistentes y entradas nominadas
              </h2>
              <Link href={detailsHref} className={styles.editLink}>
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10.5 2.5 13.5 5.5 6 13H3v-3l7.5-7.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                Editar datos
              </Link>
            </div>
            <ul className={styles.reviewList}>
              {order.slots.map((slot, i) => {
                const a = order.attendees[i];
                return (
                  <li key={slot.key} className={styles.reviewItem}>
                    <div className={styles.reviewTicket}>
                      <span className={styles.ticketChip}>Entrada {i + 1}</span>
                      <strong>{slot.sectorName}</strong>
                      <span className={styles.seatChip}>{slot.seatText}</span>
                    </div>
                    <dl className={styles.reviewData}>
                      <div>
                        <dt>Titular</dt>
                        <dd>{a ? `${a.firstName} ${a.lastName}` : "—"}</dd>
                      </div>
                      <div>
                        <dt>RUT / documento</dt>
                        <dd>{a?.document ?? "—"}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={styles.card} aria-labelledby="payment-title">
            <div className={styles.cardHeaderRow}>
              <h2 id="payment-title" className={styles.cardTitle}>
                Método de pago
              </h2>
            </div>
            <div className={styles.payOption}>
              <span className={styles.payRadio} aria-hidden="true" />
              <span className={styles.flowLogo} aria-hidden="true">
                flow
              </span>
              <span className={styles.payText}>
                <strong>Flow</strong>
                <small>Webpay Plus, tarjetas de crédito y débito, transferencias bancarias y billeteras digitales.</small>
              </span>
              <svg className={styles.payCheck} viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="m6.5 10.2 2.3 2.3 4.7-4.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className={styles.secureNote}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Te llevaremos al portal seguro de Flow para completar el pago. Passo no almacena los datos de tu tarjeta.
            </p>
          </section>

          <p className={styles.callout} data-tone="info">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>
              <strong>Entradas nominativas:</strong> cada entrada queda a nombre de su asistente, que deberá presentar su cédula de identidad o pasaporte en el acceso.
            </span>
          </p>

          <label className={styles.termsRow}>
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} disabled={expired} />
            <span>
              He leído y acepto los{" "}
              <a href="/proximamente/?title=T%C3%A9rminos%20y%20condiciones" target="_blank" rel="noopener">
                Términos y Condiciones del servicio
              </a>{" "}
              y las{" "}
              <a href="/proximamente/?title=Pol%C3%ADtica%20de%20devoluci%C3%B3n" target="_blank" rel="noopener">
                Políticas de devolución
              </a>
              .
            </span>
          </label>
        </div>

        <aside className={styles.sidebar}>
          <OrderSummary order={order} title="Detalle de tu orden">
            {error && (
              <p className={styles.formError} role="alert">
                {error.message}{" "}
                {error.code === "PAYMENT_ALREADY_STARTED" && <Link href={`/compra/${order.id}/`}>Ver estado de la compra</Link>}
              </p>
            )}
            <button type="button" className={styles.primaryButton} onClick={pay} disabled={!accepted || paying || expired} aria-busy={paying}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {payLabel}
            </button>
            {!accepted && !expired && <p className={styles.payHint}>Acepta los términos para continuar al pago.</p>}
            <Link href={detailsHref} className={styles.ghostButton}>
              Modificar datos de compra
            </Link>
          </OrderSummary>
          <HelpCard />
        </aside>
      </div>

      <div className={styles.mobileBar}>
        <div>
          <span>Total</span>
          <strong>{currency(order.total)}</strong>
        </div>
        <button type="button" className={styles.primaryButton} onClick={pay} disabled={!accepted || paying || expired} aria-busy={paying}>
          {paying ? "Conectando…" : accepted ? "Pagar" : "Acepta los términos"}
        </button>
      </div>
    </main>
  );
}
