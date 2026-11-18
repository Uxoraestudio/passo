import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import SolicitudesContent from "@/components/dashboard/SolicitudesContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Solicitudes | Aforiq Admin",
  description: "Productores que pidieron vender con Aforiq desde /organizadores.",
};

export default function SolicitudesPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <SolicitudesContent />
        </div>
      </div>
    </AuthGuard>
  );
}
