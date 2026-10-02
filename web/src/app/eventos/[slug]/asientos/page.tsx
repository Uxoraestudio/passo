import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AsientosClient from "@/components/AsientosClient";
import { toEventCardData } from "@/lib/events";
import { getEventRowBySlug } from "@/lib/events-data";
import { requireUser } from "@/lib/auth-redirect";
import { defaultEventDetail, eventDetails } from "@/lib/eventDetails";

export default async function AsientosPage({
  params,
  searchParams,
}: PageProps<"/eventos/[slug]/asientos">) {
  const { slug } = await params;
  const query = await searchParams;
  const row = await getEventRowBySlug(slug);
  const detail = row ? (eventDetails[row.id] ?? defaultEventDetail(row)) : undefined;
  const sectorId = typeof query?.sector === "string" ? query.sector : "";
  const qty = Math.max(1, Number(typeof query?.qty === "string" ? query.qty : 1) || 1);
  const tier = detail?.tiers.find((t) => t.id === sectorId);

  if (!row || !detail || !tier) {
    notFound();
  }

  await requireUser(`/eventos/${slug}/asientos/?sector=${encodeURIComponent(sectorId)}&qty=${qty}`);

  const event = toEventCardData(row);

  return (
    <>
      <Header />
      <AsientosClient event={event} detail={detail} slug={slug} tier={tier} qty={qty} />
      <Footer />
    </>
  );
}
