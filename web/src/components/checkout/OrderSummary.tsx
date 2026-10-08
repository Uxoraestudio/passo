import Image from "next/image";
import type { ReactNode } from "react";
import type { CheckoutOrder } from "@/lib/checkout-order";
import styles from "./Checkout.module.css";

export const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;

export default function OrderSummary({ order, title, children }: { order: CheckoutOrder; title: string; children?: ReactNode }) {
  const quantity = order.slots.length;
  return (
    <section className={styles.summary} aria-labelledby="order-summary-title">
      <div className={styles.summaryEvent}>
        <div className={styles.summaryThumb}>
          <Image src={order.event.image} alt="" fill sizes="56px" className={styles.cover} />
        </div>
        <div>
          {order.event.subtitle && <p className={styles.summaryKicker}>{order.event.subtitle}</p>}
          <p className={styles.summaryEventName}>{order.event.title}</p>
          <p className={styles.summaryVenue}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            {order.event.venue}, {order.event.city}
          </p>
        </div>
      </div>
      <div className={styles.summaryWhen}>
        <span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className={styles.capitalize}>{order.event.weekday}</span> {order.event.dateLong}
        </span>
        <span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {order.event.time} hrs
        </span>
      </div>

      <div className={styles.summaryBody}>
        <div className={styles.summaryHead}>
          <h2 id="order-summary-title">{title}</h2>
          <span className={styles.countChip}>
            {quantity} {quantity === 1 ? "entrada" : "entradas"}
          </span>
        </div>

        <dl className={styles.lines}>
          {order.lines.map((line) => (
            <div key={line.sectorName}>
              <dt>
                {line.quantity}× {line.sectorName}
                <small>
                  {line.seats.length > 0
                    ? `Asientos ${[...line.seats].sort((a, b) => a.localeCompare(b, "es", { numeric: true })).join(", ")}`
                    : "Acceso general"}
                  {" · "}
                  {currency(line.unitPrice)} c/u
                </small>
              </dt>
              <dd>{currency(line.unitPrice * line.quantity)}</dd>
            </div>
          ))}
          <div>
            <dt>Cargo por servicio (10%)</dt>
            <dd>{currency(order.serviceFee)}</dd>
          </div>
          <div>
            <dt>Emisión de E-Ticket</dt>
            <dd className={styles.free}>Gratis</dd>
          </div>
        </dl>

        <div className={styles.totalRow}>
          <span>Total</span>
          <div>
            <strong>{currency(order.total)}</strong>
            <small>CLP · IVA incluido</small>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}

export function HelpCard() {
  return (
    <a href="/proximamente/?title=Centro%20de%20ayuda" className={styles.helpCard}>
      <span className={styles.helpIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M4 13v-1a8 8 0 1 1 16 0v1M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Zm16 0a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>
        <strong>¿Necesitas ayuda con tu compra?</strong>
        <small>Visita nuestro centro de ayuda.</small>
      </span>
    </a>
  );
}
