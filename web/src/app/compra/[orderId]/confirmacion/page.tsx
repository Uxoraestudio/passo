import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConfirmOrder from "@/components/checkout/ConfirmOrder";
import { requireUser } from "@/lib/auth-redirect";
import { getCheckoutOrder } from "@/lib/checkout-order";

export const metadata: Metadata = {
  title: "Confirma tu orden | Passo",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ConfirmacionPage({ params }: PageProps<"/compra/[orderId]/confirmacion">) {
  const { orderId } = await params;
  if (!UUID.test(orderId)) notFound();
  await requireUser(`/compra/${orderId}/confirmacion/`);

  const order = await getCheckoutOrder(orderId);
  if (!order) notFound();
  if (order.status !== "pending" && order.status !== "expired") redirect(`/compra/${orderId}/`);
  if (order.paymentStarted) redirect(`/compra/${orderId}/`);
  // Every ticket must be named before reviewing the order.
  if (order.status === "pending" && order.attendees.length !== order.slots.length) redirect(`/compra/${orderId}/datos/`);

  return (
    <>
      <Header />
      <ConfirmOrder order={order} />
      <Footer />
    </>
  );
}
