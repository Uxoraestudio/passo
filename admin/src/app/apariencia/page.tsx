import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import AppearanceContent from "@/components/dashboard/AppearanceContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Apariencia | Passo Admin",
  description: "Administra los logos y colores de tu plataforma.",
};

export default function AparienciaPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <AppearanceContent />
        </div>
      </div>
    </AuthGuard>
  );
}
