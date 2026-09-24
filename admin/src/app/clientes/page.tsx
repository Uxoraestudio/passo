import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ClientsContent from "@/components/dashboard/ClientsContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Clientes | Passo Admin",
  description: "Directorio de clientes y asistentes: base de compradores, segmentación, comportamiento de compra y ficha detallada por cliente.",
};

export default function ClientesPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <ClientsContent />
        </div>
      </div>
    </AuthGuard>
  );
}
