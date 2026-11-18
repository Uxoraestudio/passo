import type { Metadata } from "next";
import AdminLoginHeader from "@/components/AdminLoginHeader";
import AdminLoginForm from "@/components/AdminLoginForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inicia sesión | Aforiq Admin",
  description: "Ingresa tus credenciales corporativas para gestionar la plataforma Aforiq.",
};

export default async function LoginAdminPage({ searchParams }: PageProps<"/login-admin">) {
  const { enlace } = await searchParams;
  return (
    <>
      <AdminLoginHeader />
      <main className={styles.main}>
        <div className={styles.glowTop} aria-hidden="true" />
        <div className={styles.glowBottom} aria-hidden="true" />
        <AdminLoginForm invalidLink={enlace === "invalido"} />
      </main>
    </>
  );
}
