import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import SalesContent from "@/components/dashboard/SalesContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Ventas | Passo Admin",
  description: "Control de ventas y transacciones en tiempo real: ingresos, pedidos, medios de pago y auditoría de órdenes.",
};

export default function VentasPage() {
  return (
    <AuthGuard>
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
