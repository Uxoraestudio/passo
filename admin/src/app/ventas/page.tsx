import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import SalesContent from "@/components/dashboard/SalesContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Ventas y reportes | Passo Admin",
  description: "Ingresos, entradas vendidas y órdenes pagadas, con exportación a CSV.",
};

export default function VentasPage() {
  return (
    <AuthGuard module="ventas">
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <SalesContent />
        </div>
      </div>
    </AuthGuard>
  );
}
