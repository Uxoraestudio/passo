import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ValidationContent from "@/components/dashboard/ValidationContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Validación QR | Aforiq Admin",
  description: "Escanea las entradas en la puerta y sigue en vivo cuántas personas han ingresado por cada acceso.",
};

export default function ValidarTicketPage() {
  return (
    <AuthGuard module="validacion">
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
