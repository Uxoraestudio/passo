import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import TicketsContent from "@/components/dashboard/TicketsContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Gestión de Entradas y Aforo | Passo Admin",
  description: "Control de dispersión de tickets, rendimiento por fase y asignación de contingente técnico en tiempo real.",
};

export default function EntradasPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <TicketsContent />
        </div>
      </div>
    </AuthGuard>
  );
}
