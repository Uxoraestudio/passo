import type { Metadata } from "next";
import LoginHeader from "@/components/LoginHeader";
import RecoverPasswordForm from "@/components/RecoverPasswordForm";
import LoginBrandPanel from "@/components/LoginBrandPanel";
import Footer from "@/components/Footer";
import styles from "../login-usuario/page.module.css";

export const metadata: Metadata = {
  title: "Recupera tu contraseña | Passo",
  description: "Te enviaremos un enlace para que puedas crear una nueva contraseña.",
  robots: { index: false },
};

const brandSlogan = (
  <>
    EVENTOS
    <br />
    PERSONAS
    <br />
    CULTURA
    <br />
    COMUNIDAD.
  </>
);

export default function RecuperarContrasenaPage() {
  return (
    <>
      <LoginHeader hint={{ text: "¿Recordaste tu contraseña?", linkLabel: "Inicia sesión", href: "/login-usuario/" }} />
      <main className={styles.main}>
        <div className={styles.grid}>
          <RecoverPasswordForm />
          <LoginBrandPanel
            handwritten={
              <>
                Diferentes escenarios.
                <br />
                La misma emoción.
              </>
            }
            slogan={brandSlogan}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
