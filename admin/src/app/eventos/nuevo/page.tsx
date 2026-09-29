import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import EventFormPage from "@/components/dashboard/EventFormPage";
import styles from "../../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Nuevo evento | Passo Admin",
  description: "Completa la información para crear y publicar tu evento.",
};

export default function NuevoEventoPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <EventFormPage />
        </div>
      </div>
    </AuthGuard>
  );
}
