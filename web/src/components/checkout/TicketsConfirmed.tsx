import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import type { CheckoutOrder } from "@/lib/checkout-order";
import { seatText } from "@/lib/checkout-order";
import { parseSeatLabel } from "@/lib/seatMap";
import { CopyOrderCode, PrintTicketsButton } from "./PurchaseActions";
import styles from "./Confirmed.module.css";

export type IssuedTicket = {
  id: string;
  code: string;
  sectorName: string;
  seatLabel: string | null;
  holderName: string | null;
  status: "valid" | "used" | "void";
};

function mapsUrl(order: CheckoutOrder) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.event.venue}, ${order.event.city}, Chile`)}`;
}

export default async function TicketsConfirmed({ order, tickets }: { order: CheckoutOrder; tickets: IssuedTicket[] }) {
  // The QR carries the ticket's unguessable code; the short code below is for humans.
  const qrs = await Promise.all(
    tickets.map((t) => QRCode.toString(t.code, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#140924", light: "#ffffff" } }))
  );

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <span className={styles.check} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className={styles.title}>
          ¡Tu experiencia está <span>confirmada!</span>
        </h1>
        <p className={styles.subtitle}>
          Enviamos el comprobante de pago a <strong>{order.buyer.email}</strong>
        </p>
        <CopyOrderCode code={order.code} />
      </header>

      <div className={styles.layout}>
        <section className={styles.tickets} aria-labelledby="tickets-title">
          <div className={styles.sectionHead}>
            <div>
              <h2 id="tickets-title">Tus entradas</h2>
              <p>Presenta estas entradas desde tu celular. Cada código es único e intransferible.</p>
            </div>
            <PrintTicketsButton />
          </div>

          <div className={styles.ticketGrid}>
            {tickets.map((ticket, i) => {
              const seat = ticket.seatLabel ? parseSeatLabel(ticket.seatLabel) : null;
              const shortCode = `${order.code}-${String(i + 1).padStart(2, "0")}`;
              return (
                <article key={ticket.id} className={styles.ticket} data-status={ticket.status} aria-label={`Entrada ${i + 1}, ${seatText(ticket.seatLabel)}`}>
                  <div className={styles.ticketTop}>
                    <Image src={order.event.image} alt="" fill sizes="(max-width: 640px) 100vw, 340px" className={styles.ticketImage} />
                    <span className={styles.ticketShade} />
                    <span className={styles.ticketDate}>
                      <strong>{order.event.day}</strong>
                      {order.event.month}
                      <small>{order.event.year}</small>
                    </span>
                    <span className={styles.ticketWhen}>
                      <strong>{order.event.time} h</strong>
                      {order.event.venue}
                      <small>{order.event.city}</small>
                    </span>
                    <p className={styles.ticketEvent}>
                      <span aria-hidden="true">[</span>
                      {order.event.title}
                      <span aria-hidden="true">]</span>
                    </p>
                  </div>

                  <div className={styles.ticketBody}>
                    <dl className={styles.ticketSeat}>
                      <div>
                        <dt>Sector</dt>
                        <dd>{ticket.sectorName}</dd>
                      </div>
                      <div>
                        <dt>Fila</dt>
                        <dd>{seat?.row ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>Asiento</dt>
                        {/* Plan labels that can't be split into row/number are shown whole. */}
                        <dd>{seat?.number ?? ticket.seatLabel ?? "—"}</dd>
                      </div>
                    </dl>

                    <div className={styles.qr} role="img" aria-label={`Código QR de la entrada ${i + 1}`} dangerouslySetInnerHTML={{ __html: qrs[i] }} />

                    <p className={styles.holder}>{ticket.holderName ?? "Entrada sin nominar"}</p>
                    <span className={styles.typeChip}>{ticket.seatLabel ? "Asiento numerado" : "Entrada general"}</span>
                    <p className={styles.shortCode}>Código: {shortCode}</p>
                    {ticket.status !== "valid" && (
                      <p className={styles.statusNote}>{ticket.status === "used" ? "Esta entrada ya fue utilizada." : "Esta entrada fue anulada."}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className={styles.sidebar}>
          <section className={styles.panel} aria-labelledby="ready-title">
            <h2 id="ready-title">Todo listo para vivirlo</h2>
            <p className={styles.panelSub}>Sigue estos pasos y prepárate para una experiencia inolvidable.</p>
            <ol className={styles.readySteps}>
              <li>
                <span>1</span>
                <div>
                  <strong>Revisa tu correo</strong>
                  <small>Flow te envió el comprobante de pago a {order.buyer.email}.</small>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Guarda tus entradas</strong>
                  <small>Descárgalas o encuéntralas siempre en Mi cuenta.</small>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Preséntalas desde tu celular</strong>
                  <small>Muestra el código QR y tu documento en el acceso del evento.</small>
                </div>
              </li>
            </ol>
          </section>

          <section className={styles.panel} aria-labelledby="event-title">
            <div className={styles.panelHeadRow}>
              <h2 id="event-title">Detalles del evento</h2>
              <Link href={`/eventos/${order.event.slug}/`} className={styles.textLink}>
                Ver evento →
              </Link>
            </div>
            <div className={styles.eventMini}>
              <div className={styles.eventMiniThumb}>
                <Image src={order.event.image} alt="" fill sizes="64px" className={styles.cover} />
              </div>
              <div>
                <p className={styles.eventMiniTitle}>{order.event.title}</p>
                <p className={styles.eventMiniMeta}>
                  <span className={styles.capitalize}>{order.event.weekday}</span> {order.event.dateLong} · {order.event.time} h
                </p>
                <p className={styles.eventMiniMeta}>
                  {order.event.venue}, {order.event.city}
                </p>
              </div>
            </div>
            <a href={mapsUrl(order)} target="_blank" rel="noopener noreferrer" className={styles.outlineButton}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              Ver cómo llegar
            </a>
          </section>

          <Link href="/mi-cuenta/" className={styles.accountLink}>
            Ir a mis entradas →
          </Link>
        </aside>
      </div>

      <a href="/proximamente/?title=Centro%20de%20ayuda" className={styles.helpBanner}>
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
        <span className={styles.helpText}>
          <strong>¿Necesitas ayuda?</strong>
          <small>Revisa nuestro centro de ayuda si tienes dudas sobre tu compra.</small>
        </span>
        <span className={styles.helpCta}>Centro de ayuda →</span>
      </a>
    </main>
  );
}
