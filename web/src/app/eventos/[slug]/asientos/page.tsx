import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AsientosClient from "@/components/AsientosClient";
import { toEventCardData } from "@/lib/events";
import { getEventRowBySlug } from "@/lib/events-data";
import { requireUser } from "@/lib/auth-redirect";
import { getEventSale } from "@/lib/event-sale";
import { createClient } from "@/lib/supabase/server";
import { getEventPlan } from "@/lib/seat-plan";

export default async function AsientosPage({
  params,
  searchParams,
}: PageProps<"/eventos/[slug]/asientos">) {
  const { slug } = await params;
  const query = await searchParams;
  const row = await getEventRowBySlug(slug);
  if (!row) {
    notFound();
  }

  const sectorId = typeof query?.sector === "string" ? query.sector : "";
  const requestedQty = Math.max(1, Number(typeof query?.qty === "string" ? query.qty : 1) || 1);

  await requireUser(`/eventos/${slug}/asientos/?sector=${encodeURIComponent(sectorId)}&qty=${requestedQty}`);

  const sale = await getEventSale(row);
  const tier = sale.tiers.find((t) => t.id === sectorId && t.numbered);
  if (!tier || !sale.onSale) {
    redirect(`/eventos/${slug}/entradas/`);
  }

  const supabase = await createClient();
  const [{ data: taken }, plan] = await Promise.all([
    supabase.rpc("get_taken_seats", { p_sector_id: tier.id }),
    row.venue_map_id ? getEventPlan(row.id) : Promise.resolve(null),
  ]);
  const planSector = plan?.sectors.find((s) => s.id === tier.id && s.seats.length > 0);
  const qty = Math.min(requestedQty, sale.maxPerOrder, tier.available);

  return (
    <>
      <Header />
      <AsientosClient
        event={toEventCardData(row)}
        eventId={row.id}
        detail={sale.detail}
        slug={slug}
        tier={tier}
        qty={qty}
        takenSeats={(taken ?? []) as string[]}
        plan={plan && planSector ? { map: plan, sector: planSector } : null}
      />
      <Footer />
    </>
  );
}
