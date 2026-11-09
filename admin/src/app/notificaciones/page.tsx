import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import NotificationsContent from "@/components/dashboard/NotificationsContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Notificaciones | Aforiq Admin",
  description: "Ventas, reembolsos pendientes y cortesías de todos tus eventos.",
};

export default function NotificacionesPage() {
  return (
    <AuthGuard module="ventas">
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <NotificationsContent />
        </div>
      </div>
    </AuthGuard>
  );
}
