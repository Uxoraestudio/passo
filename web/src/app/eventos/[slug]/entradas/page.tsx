import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EntradasClient from "@/components/EntradasClient";
import { toEventCardData } from "@/lib/events";
import { getEventRowBySlug } from "@/lib/events-data";
import { requireUser } from "@/lib/auth-redirect";
import { defaultEventDetail, eventDetails } from "@/lib/eventDetails";

export default async function EntradasPage({
  params,
  searchParams,
}: PageProps<"/eventos/[slug]/entradas">) {
  const { slug } = await params;
  const query = await searchParams;
  const row = await getEventRowBySlug(slug);

  if (!row) {
    notFound();
  }

  const initialTier = typeof query?.tier === "string" ? query.tier : null;
  const initialQty = typeof query?.qty === "string" ? Number(query.qty) || 0 : 0;

  const returnQuery = new URLSearchParams();
  if (initialTier) returnQuery.set("tier", initialTier);
  if (initialQty) returnQuery.set("qty", String(initialQty));
  const returnSuffix = returnQuery.size ? `?${returnQuery}` : "";
  await requireUser(`/eventos/${slug}/entradas/${returnSuffix}`);

  const event = toEventCardData(row);
  const detail = eventDetails[row.id] ?? defaultEventDetail(row);

  return (
    <>
      <Header />
      <EntradasClient event={event} detail={detail} slug={slug} initialTier={initialTier} initialQty={initialQty} />
      <Footer />
    </>
  );
}
