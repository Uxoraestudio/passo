import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ConfigContent from "@/components/dashboard/ConfigContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Configuración | Passo Admin",
  description: "Configuración de la productora: perfil corporativo, pasarelas de pago, políticas de seguridad y liquidaciones bancarias.",
};

export default function ConfiguracionPage() {
  return (
    <AuthGuard>
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
