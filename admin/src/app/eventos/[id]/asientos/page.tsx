import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import EventSeatsEditor from "@/components/event-seats/EventSeatsEditor";
import styles from "../../../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Asientos y precios | Aforiq Admin",
  description: "Zonas de precio, asientos bloqueados y accesibles del evento.",
};

export default async function AsientosEventoPage({ params }: PageProps<"/eventos/[id]/asientos">) {
  const { id } = await params;
  return (
    <AuthGuard module="eventos">
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <EventSeatsEditor eventId={id} />
        </div>
      </div>
    </AuthGuard>
  );
}
