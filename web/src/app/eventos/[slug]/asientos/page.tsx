import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AsientosClient from "@/components/AsientosClient";
import { eventBySlug } from "@/lib/events";
import { eventDetails } from "@/lib/eventDetails";

export default async function AsientosPage({
  params,
  searchParams,
}: PageProps<"/eventos/[slug]/asientos">) {
  const { slug } = await params;
  const query = await searchParams;
  const event = eventBySlug(slug);
  const detail = event ? eventDetails[event.id] : undefined;
  const sectorId = typeof query?.sector === "string" ? query.sector : "";
  const qty = Math.max(1, Number(typeof query?.qty === "string" ? query.qty : 1) || 1);
  const tier = detail?.tiers.find((t) => t.id === sectorId);

  if (!event || !detail || !tier) {
    notFound();
  }

  return (
    <>
      <Header />
      <AsientosClient event={event} detail={detail} slug={slug} tier={tier} qty={qty} />
      <Footer />
    </>
  );
}
