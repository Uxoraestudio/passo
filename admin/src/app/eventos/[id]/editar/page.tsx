import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import EventFormPage from "@/components/dashboard/EventFormPage";
import styles from "../../../inicio/page.module.css";

export const metadata: Metadata = {
  title: "Editar evento | Passo Admin",
  description: "Actualiza la información de tu evento.",
};

export default async function EditarEventoPage({ params }: PageProps<"/eventos/[id]/editar">) {
  const { id } = await params;

  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />
          <EventFormPage eventId={id} />
        </div>
      </div>
    </AuthGuard>
  );
}
