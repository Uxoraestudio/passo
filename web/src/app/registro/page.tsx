import type { Metadata } from "next";
import LoginHeader from "@/components/LoginHeader";
import RegisterForm from "@/components/RegisterForm";
import LoginBrandPanel from "@/components/LoginBrandPanel";
import Footer from "@/components/Footer";
import styles from "../login-usuario/page.module.css";

export const metadata: Metadata = {
  title: "Crea tu cuenta | Passo",
  description: "Regístrate en Passo para comprar entradas a tu próxima gran experiencia.",
};

export default function RegistroPage() {
  return (
    <>
      <LoginHeader />
      <main className={styles.main}>
        <div className={styles.grid}>
          <RegisterForm />
          <LoginBrandPanel />
        </div>
      </main>
      <Footer />
    </>
  );
}
