import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import AppSidebar from "@/components/dashboard/AppSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import KpiCard from "@/components/dashboard/KpiCard";
import SalesChart from "@/components/dashboard/SalesChart";
import CategoryDonut from "@/components/dashboard/CategoryDonut";
import UpcomingEventsTable from "@/components/dashboard/UpcomingEventsTable";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { CalendarSmallIcon, ChevronDownIcon, PlusIcon } from "@/components/icons";
import { kpis } from "@/lib/dashboard-data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Resumen general | Passo Admin",
  description: "Una visión completa de tu plataforma de eventos.",
};

export default function InicioPage() {
  return (
    <AuthGuard>
      <div className={styles.shell}>
        <AppSidebar />
        <div className={styles.content}>
          <DashboardTopbar />

          <main className={styles.main}>
            <div className={styles.heroRow}>
              <div>
                <h1 className={styles.pageTitle}>Resumen general</h1>
                <p className={styles.pageSubtitle}>Una visión completa de tu plataforma de eventos.</p>
              </div>
              <div className={styles.heroActions}>
                <button type="button" className={styles.dateFilter}>
                  <CalendarSmallIcon className={styles.dateFilterIcon} />
                  <span>Últimos 30 días</span>
                  <ChevronDownIcon className={styles.dateFilterChevron} />
                </button>
                <button type="button" className={styles.createButton}>
                  <PlusIcon className={styles.createIcon} />
                  <span>Crear evento</span>
                </button>
              </div>
            </div>

            <div className={styles.kpiGrid}>
              {kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>

            <div className={styles.analyticsGrid}>
              <SalesChart />
              <CategoryDonut />
            </div>

            <div className={styles.bottomGrid}>
              <UpcomingEventsTable />
              <RecentActivity />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
