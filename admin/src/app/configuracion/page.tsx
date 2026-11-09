import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ConfigContent from "@/components/dashboard/ConfigContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Configuración | Aforiq Admin",
  description: "Tu cuenta, tu contraseña y accesos a los ajustes del sitio.",
};

export default function ConfiguracionPage() {
  return (
    <AuthGuard module="configuracion">
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <ConfigContent />
        </div>
      </div>
    </AuthGuard>
  );
}
