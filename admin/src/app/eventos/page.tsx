import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import EventsContent from "@/components/dashboard/EventsContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Gestión de Eventos | Passo Admin",
  description: "Administra la programación, estado, aforo y recaudación de tus eventos en tiempo real.",
};

export default function EventosPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <EventsContent />
        </div>
      </div>
    </AuthGuard>
  );
}
