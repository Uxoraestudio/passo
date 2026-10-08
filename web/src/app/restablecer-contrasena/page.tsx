import type { Metadata } from "next";
import LoginHeader from "@/components/LoginHeader";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import LoginBrandPanel from "@/components/LoginBrandPanel";
import Footer from "@/components/Footer";
import styles from "../login-usuario/page.module.css";

export const metadata: Metadata = {
  title: "Crea tu nueva contraseña | Passo",
  robots: { index: false },
};

export default function RestablecerContrasenaPage() {
  return (
    <>
      <LoginHeader hint={{ text: "¿Recordaste tu contraseña?", linkLabel: "Inicia sesión", href: "/login-usuario/" }} />
      <main className={styles.main}>
        <div className={styles.grid}>
          <ResetPasswordForm />
          <LoginBrandPanel />
        </div>
      </main>
      <Footer />
    </>
  );
}
