import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import OverviewContent from "@/components/dashboard/OverviewContent";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Resumen general | Passo Admin",
  description: "Ventas, eventos y clientes de tu plataforma, en tiempo real.",
};

export default function InicioPage() {
  return (
    <AuthGuard module="resumen">
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <OverviewContent />
        </div>
      </div>
    </AuthGuard>
  );
}
