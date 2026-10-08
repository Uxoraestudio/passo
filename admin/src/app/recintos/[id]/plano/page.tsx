import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import VenueMapEditor from "@/components/venue-editor/VenueMapEditor";
import styles from "../../../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Plano del recinto | Passo Admin",
  description: "Editor del plano: sectores, escenario, accesos y escala del recinto.",
};

export default async function PlanoPage({ params }: PageProps<"/recintos/[id]/plano">) {
  const { id } = await params;
  return (
    <AuthGuard module="eventos">
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <VenueMapEditor venueId={id} />
        </div>
      </div>
    </AuthGuard>
  );
}
