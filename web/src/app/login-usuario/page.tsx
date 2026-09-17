import type { Metadata } from "next";
import LoginHeader from "@/components/LoginHeader";
import LoginForm from "@/components/LoginForm";
import LoginBrandPanel from "@/components/LoginBrandPanel";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inicia sesión | Passo",
  description: "Inicia sesión en Passo. Tu próxima gran experiencia te está esperando.",
};

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
