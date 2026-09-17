import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedEvents from "@/components/FeaturedEvents";
import EstasDentroBanner from "@/components/EstasDentroBanner";
import NearYou from "@/components/NearYou";
import OrganizersBanner from "@/components/OrganizersBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturedEvents />
        <EstasDentroBanner />
        <NearYou />
        <OrganizersBanner />
      </main>
      <Footer />
    </>
  );
}
