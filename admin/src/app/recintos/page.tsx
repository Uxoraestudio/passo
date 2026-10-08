import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import VenuesContent from "@/components/venue-editor/VenuesContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Recintos | Passo Admin",
  description: "Recintos y sus planos de sectores y asientos, reutilizables en cada evento.",
};

export default function RecintosPage() {
  return (
    <AuthGuard module="eventos">
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <VenuesContent />
        </div>
      </div>
    </AuthGuard>
  );
}
