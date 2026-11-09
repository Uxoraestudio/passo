import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ProductorasContent from "@/components/dashboard/ProductorasContent";
import styles from "../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Productoras | Aforiq Admin",
  description: "Productoras de la plataforma: crea productoras y asigna a su dueño.",
};

export default function ProductorasPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <ProductorasContent />
        </div>
      </div>
    </AuthGuard>
  );
}
