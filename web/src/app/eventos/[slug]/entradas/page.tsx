import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EntradasClient from "@/components/EntradasClient";
import { eventBySlug } from "@/lib/events";
import { eventDetails } from "@/lib/eventDetails";

export default async function EntradasPage({
  params,
  searchParams,
}: PageProps<"/eventos/[slug]/entradas">) {
  const { slug } = await params;
  const query = await searchParams;
  const event = eventBySlug(slug);
  const detail = event ? eventDetails[event.id] : undefined;

  if (!event || !detail) {
    notFound();
  }

  const initialTier = typeof query?.tier === "string" ? query.tier : null;
  const initialQty = typeof query?.qty === "string" ? Number(query.qty) || 0 : 0;

  return (
    <>
      <Header />
      <EntradasClient event={event} detail={detail} slug={slug} initialTier={initialTier} initialQty={initialQty} />
      <Footer />
    </>
  );
}
