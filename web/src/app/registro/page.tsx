import type { Metadata } from "next";
import LoginHeader from "@/components/LoginHeader";
import RegisterForm from "@/components/RegisterForm";
import LoginBrandPanel from "@/components/LoginBrandPanel";
import Footer from "@/components/Footer";
import { getSeoPage } from "@/lib/seo-settings";
import { safeNextPath } from "@/lib/auth-redirect";
import styles from "../login-usuario/page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoPage("registro");
  const title = seo.metaTitle || "Crea tu cuenta | Passo";
  const description = seo.metaDescription || "Regístrate en Passo para comprar entradas a tu próxima gran experiencia.";

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

export default async function RegistroPage({ searchParams }: PageProps<"/registro">) {
  const next = safeNextPath((await searchParams)?.next);

  return (
    <>
      <LoginHeader />
      <main className={styles.main}>
        <div className={styles.grid}>
          <RegisterForm next={next} />
          <LoginBrandPanel />
        </div>
      </main>
      <Footer />
    </>
  );
}
