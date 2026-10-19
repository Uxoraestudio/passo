import type { Metadata } from "next";
import LoginHeader from "@/components/LoginHeader";
import LoginForm from "@/components/LoginForm";
import LoginBrandPanel from "@/components/LoginBrandPanel";
import Footer from "@/components/Footer";
import { getSeoPage } from "@/lib/seo-settings";
import { safeNextPath } from "@/lib/auth-redirect";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoPage("login");
  const title = seo.metaTitle || "Inicia sesión | Aforiq";
  const description = seo.metaDescription || "Inicia sesión en Aforiq. Tu próxima gran experiencia te está esperando.";

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

export default async function LoginUsuarioPage({ searchParams }: PageProps<"/login-usuario">) {
  const params = await searchParams;
  const next = safeNextPath(params?.next);

  return (
    <>
      <LoginHeader next={next} />
      <main className={styles.main}>
        <div className={styles.grid}>
          <LoginForm next={next} invalidLink={params?.enlace === "invalido"} />
          <LoginBrandPanel />
        </div>
      </main>
      <Footer />
    </>
  );
}
