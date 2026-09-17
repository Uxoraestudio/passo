import type { Metadata } from "next";
import AdminLoginHeader from "@/components/AdminLoginHeader";
import AdminLoginForm from "@/components/AdminLoginForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inicia sesión | Passo Admin",
  description: "Ingresa tus credenciales corporativas para gestionar la plataforma Passo.",
};

export default function LoginAdminPage() {
  return (
    <>
      <AdminLoginHeader />
      <main className={styles.main}>
        <div className={styles.glowTop} aria-hidden="true" />
        <div className={styles.glowBottom} aria-hidden="true" />
        <AdminLoginForm />
      </main>
    </>
  );
}
