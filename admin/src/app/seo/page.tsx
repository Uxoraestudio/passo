import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import SeoContent from "@/components/dashboard/SeoContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "SEO | Passo Admin",
  description: "Administra el SEO de las páginas principales del sitio.",
};

export default function SeoPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <SeoContent />
        </div>
      </div>
    </AuthGuard>
  );
}
