"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { listEvents, type EventRecord } from "@/lib/events-data";
import { clp, deltaLabel, fetchMetrics, int, orderKindLabels, timeAgo, type Metrics, type Period } from "@/lib/admin-data";
import { useCanEdit } from "@/lib/access";
import KpiCard, { type KpiDatum } from "./KpiCard";
import SalesChart from "./SalesChart";
import CategoryDonut from "./CategoryDonut";
import UpcomingEventsTable from "./UpcomingEventsTable";
import RecentActivity, { type ActivityItem } from "./RecentActivity";
import PeriodSelect from "./PeriodSelect";
import styles from "@/app/inicio/page.module.css";

type Data = { loadedAt: number; metrics: Metrics | null; events: EventRecord[]; signups: { id: string; full_name: string | null; email: string; created_at: string }[] };

function activityFrom(data: Data): ActivityItem[] {
  const orders: (ActivityItem & { at: string })[] = (data.metrics?.recent_orders ?? [])
    .filter((o) => o.status === "paid")
    .map((o) => ({
      id: o.id,
      kind: o.kind === "sale" ? "venta" : "cortesia",
      text:
        o.kind === "sale"
          ? `Venta de ${o.quantity} ${o.quantity === 1 ? "entrada" : "entradas"} para ${o.event_title} · ${clp(o.total)}`
          : `${orderKindLabels[o.kind]}: ${o.quantity} para ${o.buyer_name ?? o.buyer_email} · ${o.event_title}`,
      time: timeAgo(o.paid_at ?? o.created_at, data.loadedAt),
      at: o.paid_at ?? o.created_at,
    }));
  const signups = data.signups.map((p) => ({
    id: p.id,
    kind: "cliente" as const,
    text: `Nuevo cliente registrado: ${p.full_name || p.email}`,
    time: timeAgo(p.created_at, data.loadedAt),
    at: p.created_at,
  }));
  return [...orders, ...signups].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
}

export default function OverviewContent() {
  const canCreate = useCanEdit("eventos");
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    // Events must show even when sales metrics can't load (no permission, or the
    // metrics migration isn't applied yet), so each source fails on its own.
    Promise.all([
      fetchMetrics(period).catch(() => null),
      listEvents(),
      supabase.from("profiles").select("id, full_name, email, created_at").eq("role", "cliente").order("created_at", { ascending: false }).limit(6),
    ])
      .then(([metrics, events, signups]) => {
        if (!active) return;
        setData({ loadedAt: Date.now(), metrics, events, signups: signups.data ?? [] });
        setError("");
      })
      .catch(() => active && setError("No pudimos cargar los eventos. Revisa tu conexión e inténtalo de nuevo."));
    return () => {
      active = false;
    };
  }, [period, reload]);

  const now = data?.loadedAt ?? 0;
  const upcoming = (data?.events ?? [])
    .filter((e) => e.status !== "borrador" && e.status !== "finalizado" && new Date(e.event_date).getTime() >= now)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const capacity = upcoming.reduce((sum, e) => sum + e.capacity, 0);
  const sold = upcoming.reduce((sum, e) => sum + e.sold, 0);

  const kpis: KpiDatum[] = data
    ? [
        {
          id: "ingresos",
          label: "Ingresos por ventas",
          value: data.metrics ? clp(data.metrics.revenue) : "—",
          delta: data.metrics ? deltaLabel(data.metrics.revenue, data.metrics.revenue_prev) : null,
          caption: data.metrics ? undefined : "Métricas no disponibles",
          iconBg: "purple",
          icon: "bars",
        },
        {
          id: "entradas",
          label: "Entradas vendidas",
          value: data.metrics ? int(data.metrics.tickets) : "—",
          delta: data.metrics ? deltaLabel(data.metrics.tickets, data.metrics.tickets_prev) : null,
          caption: data.metrics ? undefined : "Métricas no disponibles",
          iconBg: "orange",
          icon: "ticket",
        },
        {
          id: "eventos",
          label: "Eventos en venta",
          value: int(upcoming.filter((e) => e.status === "en-venta" || e.status === "casi-agotado").length),
          delta: null,
          caption: `${upcoming.length} próximos publicados`,
          iconBg: "purple",
          icon: "calendar",
        },
        {
          id: "ocupacion",
          label: "Ocupación próximos eventos",
          value: `${capacity > 0 ? Math.round((sold / capacity) * 100) : 0}%`,
          delta: null,
          caption: `${int(sold)} de ${int(capacity)} lugares`,
          iconBg: "orange",
          icon: "pie",
        },
      ]
    : [];

  return (
    <main className={styles.main}>
      <div className={styles.heroRow}>
        <div>
          <h1 className={styles.pageTitle}>Resumen general</h1>
          <p className={styles.pageSubtitle}>Ventas, eventos y clientes de tu plataforma, en tiempo real.</p>
        </div>
        <div className={styles.heroActions}>
          <PeriodSelect value={period} onChange={setPeriod} />
          {canCreate && (
            <Link href="/eventos/nuevo/" className={styles.createButton}>
              <PlusIcon className={styles.createIcon} />
              <span>Crear evento</span>
            </Link>
          )}
        </div>
      </div>

      {error ? (
        <div className={styles.stateCard} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setReload((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      ) : !data ? (
        <div className={styles.stateCard} aria-busy="true">
          <p>Cargando métricas…</p>
        </div>
      ) : (
        <>
          <div className={styles.kpiGrid}>
            {kpis.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>

          {data.metrics ? (
            <div className={styles.analyticsGrid}>
              <SalesChart days={data.metrics.daily} />
              <CategoryDonut data={data.metrics.by_category} />
            </div>
          ) : (
            <div className={styles.stateCard} role="status">
              <p>Las métricas de ventas no están disponibles todavía. Tus eventos se muestran igual más abajo.</p>
            </div>
          )}

          <div className={styles.bottomGrid}>
            <UpcomingEventsTable events={upcoming.slice(0, 6)} />
            <RecentActivity items={activityFrom(data)} />
          </div>
        </>
      )}
    </main>
  );
}
