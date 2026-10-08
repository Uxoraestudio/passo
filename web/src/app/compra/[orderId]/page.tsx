import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PendingRefresh from "@/components/PendingRefresh";
import { requireUser } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { syncFlowPayment, type OrderStatus } from "@/lib/payments";
import { getCheckoutOrder } from "@/lib/checkout-order";
import TicketsConfirmed, { type IssuedTicket } from "@/components/checkout/TicketsConfirmed";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Estado de tu compra | Passo",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;

type OrderView = {
  id: string;
  code: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  service_fee: number;
  flow_token: string | null;
  buyer_email: string;
  event: { title: string; slug: string } | null;
  order_items: { sector_name: string; quantity: number; unit_price: number; seat_labels: string[] }[];
};

const copy: Record<OrderStatus, { tone: "ok" | "wait" | "bad"; eyebrow: string; title: string; body: string }> = {
  paid: {
    tone: "ok",
    eyebrow: "Compra confirmada",
    title: "¡Listo! Tus entradas ya son tuyas",
    body: "Flow te enviará el comprobante de pago por correo. Tus entradas ya están en Mi cuenta.",
  },
  pending: {
    tone: "wait",
    eyebrow: "Confirmando pago",
    title: "Estamos confirmando tu pago con Flow",
    body: "Esto suele tardar unos segundos. Esta página se actualizará sola; no vuelvas a pagar.",
  },
  rejected: {
    tone: "bad",
    eyebrow: "Pago rechazado",
    title: "Tu pago no se completó",
    body: "El medio de pago rechazó la transacción y no se hizo ningún cobro. Liberamos tus entradas; puedes intentarlo de nuevo.",
  },
  cancelled: {
    tone: "bad",
    eyebrow: "Pago cancelado",
    title: "Cancelaste el pago",
    body: "No se hizo ningún cobro y liberamos tus entradas. Puedes volver a elegirlas cuando quieras.",
  },
  expired: {
    tone: "bad",
    eyebrow: "Reserva vencida",
    title: "Se acabó el tiempo de tu reserva",
    body: "Tus entradas estuvieron reservadas 15 minutos y el pago no llegó a tiempo. No se hizo ningún cobro.",
  },
  refund_required: {
    tone: "bad",
    eyebrow: "Devolución en curso",
    title: "Recibimos tu pago, pero tus entradas ya no estaban disponibles",
    body: "El pago llegó después de que venciera tu reserva y otra persona tomó esos lugares. Te devolveremos el monto completo; nuestro equipo te contactará por correo.",
  },
};

async function loadOrder(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, code, status, total, subtotal, service_fee, flow_token, buyer_email, event:events(title, slug), order_items(sector_name, quantity, unit_price, seat_labels)")
    .eq("id", orderId)
    .maybeSingle();
  return data as OrderView | null;
}

async function loadTickets(orderId: string): Promise<IssuedTicket[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("id, code, sector_name, seat_label, holder_name, status")
    .eq("order_id", orderId)
    .order("seat_label", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  return ((data ?? []) as { id: string; code: string; sector_name: string; seat_label: string | null; holder_name: string | null; status: IssuedTicket["status"] }[]).map(
    (t) => ({ id: t.id, code: t.code, sectorName: t.sector_name, seatLabel: t.seat_label, holderName: t.holder_name, status: t.status })
  );
}

export default async function CompraPage({ params }: PageProps<"/compra/[orderId]">) {
  const { orderId } = await params;
  if (!UUID.test(orderId)) notFound();
  await requireUser(`/compra/${orderId}/`);

  let order = await loadOrder(orderId);
  if (!order) notFound();

  // The Flow callback can't reach a local machine and may lag in production:
  // while the order is pending, ask Flow directly.
  if (order.status === "pending" && order.flow_token) {
    try {
      await syncFlowPayment(order.flow_token, "reconcile");
      order = (await loadOrder(orderId)) ?? order;
    } catch (cause) {
      console.error("Flow reconcile failed", cause);
    }
  }

  // Reserved but not sent to Flow yet: the buyer is still filling in the details.
  if (order.status === "pending" && !order.flow_token) {
    redirect(`/compra/${orderId}/datos/`);
  }

  if (order.status === "paid") {
    const [checkout, tickets] = await Promise.all([getCheckoutOrder(orderId), loadTickets(orderId)]);
    if (checkout && tickets.length > 0) {
      return (
        <>
          <Header />
          <TicketsConfirmed order={checkout} tickets={tickets} />
          <Footer />
        </>
      );
    }
  }

  const view = copy[order.status];
  const retryHref = order.event ? `/eventos/${order.event.slug}/entradas/` : "/eventos/";

  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.card} data-tone={view.tone} aria-labelledby="compra-titulo">
          <span className={styles.eyebrow}>{view.eyebrow}</span>
          <h1 id="compra-titulo" className={styles.title}>
            {view.title}
          </h1>
          <p className={styles.body}>{view.body}</p>
          {order.status === "pending" && <PendingRefresh />}

          <dl className={styles.summary}>
            <div>
              <dt>Orden</dt>
              <dd>{order.code}</dd>
            </div>
            {order.event && (
              <div>
                <dt>Evento</dt>
                <dd>{order.event.title}</dd>
              </div>
            )}
            {order.order_items.map((item) => (
              <div key={item.sector_name}>
                <dt>
                  {item.quantity}× {item.sector_name}
                  {item.seat_labels.length > 0 && <small>Asientos {item.seat_labels.join(", ")}</small>}
                </dt>
                <dd>{currency(item.unit_price * item.quantity)}</dd>
              </div>
            ))}
            <div>
              <dt>Cargo por servicio</dt>
              <dd>{currency(order.service_fee)}</dd>
            </div>
            <div className={styles.total}>
              <dt>Total</dt>
              <dd>{currency(order.total)}</dd>
            </div>
          </dl>

          <div className={styles.actions}>
            {order.status === "paid" ? (
              <Link href="/mi-cuenta/" className={styles.primary}>
                Ver mis entradas
              </Link>
            ) : order.status === "pending" ? (
              <Link href="/mi-cuenta/" className={styles.secondary}>
                Ir a Mi cuenta
              </Link>
            ) : order.status === "refund_required" ? (
              <Link href="/eventos/" className={styles.secondary}>
                Ver otros eventos
              </Link>
            ) : (
              <Link href={retryHref} className={styles.primary}>
                Intentar de nuevo
              </Link>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
