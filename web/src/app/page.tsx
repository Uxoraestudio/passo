import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedEvents from "@/components/FeaturedEvents";
import EstasDentroBanner from "@/components/EstasDentroBanner";
import NearYou from "@/components/NearYou";
import OrganizersBanner from "@/components/OrganizersBanner";
import Footer from "@/components/Footer";
import { getAllEvents, getHeroEvents } from "@/lib/events-data";
import { getSeoPage } from "@/lib/seo-settings";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoPage("home");
  const title = seo.metaTitle || "Passo";
  const description = seo.metaDescription || "Tu lugar en lo extraordinario. Entradas digitales, seguras y al instante.";

  return {
    title,
    description,
    openGraph: {
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: seo.ogImageUrl ? [seo.ogImageUrl] : [],
    },
  };
}

export default async function Home() {
  const [heroSlides, allEvents] = await Promise.all([getHeroEvents(), getAllEvents()]);

  return (
    <>
      <Header />
      <main>
        <Hero slides={heroSlides} />
        <FeaturedEvents />
        <EstasDentroBanner />
        <NearYou events={allEvents} />
        <OrganizersBanner />
      </main>
      <Footer />
    </>
  );
}
