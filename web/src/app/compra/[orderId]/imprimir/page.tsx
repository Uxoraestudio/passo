import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-redirect";
import { getSiteSettings } from "@/lib/site-settings";
import { getCheckoutOrder } from "@/lib/checkout-order";
import { loadOrderTickets, ticketQrSvg } from "@/lib/order-tickets";
import PrintNow from "./PrintNow";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Tus entradas | Aforiq",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Printable tickets (print or "Save as PDF"). Plain black on white, no
// background images or effects, so they come out the same with the browser's
// "background graphics" option off. Each ticket carries its real QR.
export default async function ImprimirEntradasPage({ params, searchParams }: PageProps<"/compra/[orderId]/imprimir">) {
  const { orderId } = await params;
  const auto = (await searchParams).auto === "1";
  if (!UUID.test(orderId)) notFound();
  await requireUser(`/compra/${orderId}/imprimir/`);

  const [order, tickets, settings] = await Promise.all([getCheckoutOrder(orderId), loadOrderTickets(orderId), getSiteSettings()]);
  if (!order) notFound();
  if (order.status !== "paid" || tickets.length === 0) redirect(`/compra/${orderId}/`);

  const qrs = await Promise.all(tickets.map((t) => ticketQrSvg(t.code)));
  const event = order.event;

  return (
    <main className={styles.sheet}>
      <div className={styles.toolbar}>
        <p>
          {tickets.length === 1 ? "Tu entrada" : `Tus ${tickets.length} entradas`} para <strong>{event.title}</strong>
        </p>
        <PrintNow auto={auto} />
      </div>

      {tickets.map((ticket, i) => (
        <article key={ticket.id} className={styles.ticket} data-status={ticket.status} aria-label={`Entrada ${i + 1}, ${ticket.seatText}`}>
          <header className={styles.head}>
            <div>
              <p className={styles.brand}>
                {settings.logoPrimaryUrl && (
                  // A plain <img>: prints reliably and needs no image optimisation.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.logoPrimaryUrl} alt="" className={styles.logo} />
                )}
                Entrada oficial
              </p>
              <h1 className={styles.title}>{event.title}</h1>
              {event.subtitle && <p className={styles.subtitle}>{event.subtitle}</p>}
            </div>
            <p className={styles.count}>
              Entrada {i + 1} de {tickets.length}
            </p>
          </header>

          <div className={styles.body}>
            <div className={styles.qr} role="img" aria-label={`Código QR de la entrada ${i + 1}`} dangerouslySetInnerHTML={{ __html: qrs[i] }} />

            <dl className={styles.facts}>
              <div>
                <dt>Fecha</dt>
                <dd>
                  {event.weekday} {event.dateLong} · {event.time} h
                </dd>
              </div>
              <div>
                <dt>Lugar</dt>
                <dd>
                  {event.venue}, {event.city}
                </dd>
              </div>
              <div>
                <dt>Sector</dt>
                <dd>{ticket.sectorName}</dd>
              </div>
              <div>
                <dt>Ubicación</dt>
                <dd className={styles.seat}>{ticket.seatText}</dd>
              </div>
              <div>
                <dt>Titular</dt>
                <dd>{ticket.holderName ?? "Entrada sin nominar"}</dd>
              </div>
              <div>
                <dt>Código</dt>
                <dd className={styles.code}>
                  {order.code}-{String(i + 1).padStart(2, "0")}
                </dd>
              </div>
            </dl>
          </div>

          {ticket.status !== "valid" && (
            <p className={styles.void}>{ticket.status === "used" ? "Esta entrada ya fue utilizada." : "Esta entrada fue anulada y no es válida."}</p>
          )}
          <p className={styles.note}>
            Presenta este código QR (impreso o en tu celular) junto a tu cédula de identidad o pasaporte en el acceso. Cada código es único y sirve una sola vez.
          </p>
        </article>
      ))}
    </main>
  );
}
