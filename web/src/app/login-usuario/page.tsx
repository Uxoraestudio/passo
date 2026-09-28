import type { Metadata } from "next";
import LoginHeader from "@/components/LoginHeader";
import LoginForm from "@/components/LoginForm";
import LoginBrandPanel from "@/components/LoginBrandPanel";
import Footer from "@/components/Footer";
import { getSeoPage } from "@/lib/seo-settings";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoPage("login");
  const title = seo.metaTitle || "Inicia sesión | Passo";
  const description = seo.metaDescription || "Inicia sesión en Passo. Tu próxima gran experiencia te está esperando.";

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

export default function LoginUsuarioPage() {
  return (
    <>
      <LoginHeader />
      <main className={styles.main}>
        <div className={styles.grid}>
          <LoginForm />
          <LoginBrandPanel />
        </div>
      </main>
      <Footer />
    </>
  );
}
