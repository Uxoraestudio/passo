import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ValidationContent from "@/components/dashboard/ValidationContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Validación QR | Passo Admin",
  description: "Control de acceso y validación QR en vivo, con desglose de puertas, consola del validador y registro de incidencias.",
};

export default function ValidarTicketPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <ValidationContent />
        </div>
      </div>
    </AuthGuard>
  );
}
