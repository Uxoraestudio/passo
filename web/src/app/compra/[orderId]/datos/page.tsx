import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NominationForm from "@/components/checkout/NominationForm";
import { requireUser } from "@/lib/auth-redirect";
import { getCheckoutOrder } from "@/lib/checkout-order";

export const metadata: Metadata = {
  title: "Tus datos | Passo",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DatosPage({ params }: PageProps<"/compra/[orderId]/datos">) {
  const { orderId } = await params;
  if (!UUID.test(orderId)) notFound();
  await requireUser(`/compra/${orderId}/datos/`);

  const order = await getCheckoutOrder(orderId);
  if (!order) notFound();
  // Paid, failed or already sent to Flow: the result page explains where it stands.
  if (order.status !== "pending" && order.status !== "expired") redirect(`/compra/${orderId}/`);
  if (order.paymentStarted) redirect(`/compra/${orderId}/`);

  return (
    <>
      <Header />
      <NominationForm order={order} />
      <Footer />
    </>
  );
}
