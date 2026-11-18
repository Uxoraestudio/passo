import type { Metadata } from "next";
import AdminLoginHeader from "@/components/AdminLoginHeader";
import CreatePasswordForm from "@/components/CreatePasswordForm";
import styles from "../login-admin/page.module.css";

export const metadata: Metadata = {
  title: "Crea tu contraseña | Aforiq Admin",
  description: "Elige la contraseña con la que entrarás al panel de tu productora.",
};

export default function CreatePasswordPage() {
  return (
    <>
      <AdminLoginHeader />
      <main className={styles.main}>
        <div className={styles.glowTop} aria-hidden="true" />
        <div className={styles.glowBottom} aria-hidden="true" />
        <CreatePasswordForm />
      </main>
    </>
  );
}
