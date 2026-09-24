import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import RolesContent from "@/components/dashboard/RolesContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Roles | Passo Admin",
  description: "Equipo, roles y permisos: gestión de accesos, matriz granular de permisos por módulo y auditoría de miembros del equipo.",
};

export default function RolesPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <RolesContent />
        </div>
      </div>
    </AuthGuard>
  );
}
