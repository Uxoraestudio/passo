import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import EventAttendees from "@/components/dashboard/EventAttendees";
import styles from "../../../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Lista de asistentes | Passo Admin",
  description: "Asistentes del evento con el detalle de su compra, cortesías y estado de validación.",
};

export default async function AsistentesPage({ params }: PageProps<"/eventos/[id]/asistentes">) {
  const { id } = await params;
  return (
    <AuthGuard module="eventos">
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <EventAttendees eventId={id} />
        </div>
      </div>
    </AuthGuard>
  );
}
