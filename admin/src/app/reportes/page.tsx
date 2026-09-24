import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ReportsContent from "@/components/dashboard/ReportsContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Reportes | Passo Admin",
  description: "Reportes y analítica de rendimiento: recaudación, ocupación, curva de venta, liquidaciones por evento y conciliación bancaria.",
};

export default function ReportesPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <ReportsContent />
        </div>
      </div>
    </AuthGuard>
  );
}
