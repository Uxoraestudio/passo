"use client";

import { useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import {
  clp,
  deltaLabel,
  downloadCsv,
  fetchMetrics,
  formatDateTime,
  int,
  orderKindLabels,
  orderStatusLabels,
  rangeFor,
  type Metrics,
  type OrderStatus,
  type Period,
} from "@/lib/admin-data";
import KpiCard, { type KpiDatum } from "./KpiCard";
import SalesChart from "./SalesChart";
import PeriodSelect from "./PeriodSelect";
import pageStyles from "@/app/inicio/page.module.css";
import styles from "./SalesContent.module.css";

type StatusFilter = "todas" | "paid" | "pending" | "failed" | "refund_required";

const statusFilters: { id: StatusFilter; label: string; match: (s: OrderStatus) => boolean }[] = [
  { id: "todas", label: "Todas", match: () => true },
  { id: "paid", label: "Pagadas", match: (s) => s === "paid" },
  { id: "pending", label: "Pendientes", match: (s) => s === "pending" },
  { id: "failed", label: "Rechazadas / expiradas", match: (s) => s === "rejected" || s === "expired" },
  { id: "refund_required", label: "Por reembolsar", match: (s) => s === "refund_required" },
];

export default function SalesContent() {
  const [period, setPeriod] = useState<Period>("30d");
  const [eventId, setEventId] = useState<string>("");
  const [status, setStatus] = useState<StatusFilter>("todas");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [eventOptions, setEventOptions] = useState<{ id: string; title: string }[]>([]);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    fetchMetrics(period, eventId || null)
      .then((data) => {
        if (!active) return;
        setMetrics(data);
        setError("");
        // Keep the full event list from the unfiltered view for the selector.
        if (!eventId) setEventOptions(data.by_event.map((e) => ({ id: e.id, title: e.title })));
      })
      .catch(() => active && setError("No pudimos cargar las ventas. Revisa tu conexión e inténtalo de nuevo."));
    return () => {
      active = false;
    };
  }, [period, eventId, reload]);

  const orders = useMemo(() => {
    const match = statusFilters.find((f) => f.id === status)!.match;
    return (metrics?.recent_orders ?? []).filter((o) => match(o.status));
  }, [metrics, status]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { from, to } = rangeFor(period);
      let query = createClient()
        .from("orders")
        .select("code, created_at, paid_at, status, kind, buyer_name, buyer_email, subtotal, service_fee, total, event:events(title), order_items(sector_name, quantity, seat_labels)")
        .gte("created_at", from.toISOString())
        .lt("created_at", to.toISOString())
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (eventId) query = query.eq("event_id", eventId);
      const { data, error: exportError } = await query;
      if (exportError) throw exportError;
      const rows = (data ?? []) as unknown as {
        code: string;
        created_at: string;
        paid_at: string | null;
        status: OrderStatus;
        kind: keyof typeof orderKindLabels;
        buyer_name: string | null;
        buyer_email: string;
        subtotal: number;
        service_fee: number;
        total: number;
        event: { title: string } | null;
        order_items: { sector_name: string; quantity: number; seat_labels: string[] }[];
      }[];
      downloadCsv(`ventas-${period}-${new Date().toISOString().slice(0, 10)}.csv`, [
        ["Orden", "Creada", "Pagada", "Estado", "Tipo", "Evento", "Sectores", "Entradas", "Comprador", "Correo", "Subtotal", "Cargo servicio", "Total"],
        ...rows.map((o) => [
          o.code,
          formatDateTime(o.created_at),
          o.paid_at ? formatDateTime(o.paid_at) : "",
          orderStatusLabels[o.status],
          orderKindLabels[o.kind],
          o.event?.title ?? "",
          o.order_items.map((i) => `${i.sector_name}${i.seat_labels.length ? ` (${i.seat_labels.join(" ")})` : ""}`).join(" / "),
          o.order_items.reduce((sum, i) => sum + i.quantity, 0),
          o.buyer_name ?? "",
          o.buyer_email,
          o.subtotal,
          o.service_fee,
          o.total,
        ]),
      ]);
    } catch {
      setError("No pudimos generar el archivo. Inténtalo de nuevo.");
    } finally {
      setExporting(false);
    }
  };

  const kpis: KpiDatum[] = metrics
    ? [
        { id: "ingresos", label: "Ingresos", value: clp(metrics.revenue), delta: deltaLabel(metrics.revenue, metrics.revenue_prev), iconBg: "purple", icon: "bars" },
        {
          id: "entradas",
          label: "Entradas vendidas",
          value: int(metrics.tickets),
          delta: deltaLabel(metrics.tickets, metrics.tickets_prev),
          caption: metrics.courtesies > 0 ? `+ ${int(metrics.courtesies)} cortesías` : undefined,
          iconBg: "orange",
          icon: "ticket",
        },
        {
          id: "ordenes",
          label: "Órdenes pagadas",
          value: int(metrics.orders),
          delta: null,
          caption: metrics.orders > 0 ? `Promedio ${clp(metrics.revenue / metrics.orders)} por orden` : "Sin órdenes en el período",
          iconBg: "purple",
          icon: "calendar",
        },
        {
          id: "conversion",
          label: "Conversión de pago",
          value: metrics.conversion == null ? "—" : `${metrics.conversion.toLocaleString("es-CL")}%`,
          delta: null,
          caption: "Reservas que terminan pagadas",
          iconBg: "orange",
          icon: "pie",
        },
      ]
    : [];

  return (
    <main className={pageStyles.main}>
      <div className={pageStyles.heroRow}>
        <div>
          <h1 className={pageStyles.pageTitle}>Ventas y reportes</h1>
          <p className={pageStyles.pageSubtitle}>Ingresos, entradas y órdenes pagadas con Flow.</p>
        </div>
        <div className={pageStyles.heroActions}>
          <label className={styles.eventSelect}>
            <span className="sr-only">Evento</span>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">Todos los eventos</option>
              {eventOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          <PeriodSelect value={period} onChange={setPeriod} />
          <button type="button" className={styles.exportButton} onClick={exportCsv} disabled={exporting || !metrics}>
            <MaterialIcon decorative name="download" />
            {exporting ? "Generando…" : "Exportar CSV"}
          </button>
        </div>
      </div>

      {error ? (
        <div className={pageStyles.stateCard} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setReload((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      ) : !metrics ? (
        <div className={pageStyles.stateCard} aria-busy="true">
          <p>Cargando ventas…</p>
        </div>
      ) : (
        <>
          <div className={pageStyles.kpiGrid}>
            {kpis.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>

          <div className={pageStyles.analyticsGrid}>
            <SalesChart days={metrics.daily} />
            <section className={styles.card} aria-labelledby="ventas-por-evento">
              <h3 id="ventas-por-evento" className={styles.cardTitle}>
                Ventas por evento
              </h3>
              <p className={styles.cardSubtitle}>Ingresos del período y ocupación total.</p>
              {metrics.by_event.length === 0 ? (
                <p className={styles.empty}>No hay eventos publicados.</p>
              ) : (
                <ul className={styles.eventList}>
                  {metrics.by_event.slice(0, 6).map((e) => {
                    const occupancy = e.capacity > 0 ? Math.min(100, Math.round((e.sold / e.capacity) * 100)) : 0;
                    return (
                      <li key={e.id}>
                        <div className={styles.eventTop}>
                          <span className={styles.eventName}>{e.title}</span>
                          <span className={styles.eventRevenue}>{clp(e.revenue)}</span>
                        </div>
                        <div className={styles.bar} role="progressbar" aria-valuenow={occupancy} aria-valuemin={0} aria-valuemax={100} aria-label={`Ocupación de ${e.title}`}>
                          <span style={{ transform: `scaleX(${occupancy / 100})` }} />
                        </div>
                        <div className={styles.eventMeta}>
                          <span>{int(e.tickets)} vendidas en el período</span>
                          <span>
                            {occupancy}% · {int(e.sold)}/{int(e.capacity)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <section className={styles.card} aria-labelledby="transacciones">
            <div className={styles.tableHeader}>
              <div>
                <h3 id="transacciones" className={styles.cardTitle}>
                  Transacciones
                </h3>
                <p className={styles.cardSubtitle}>Las 50 órdenes más recientes del período. Exporta el CSV para verlas todas.</p>
              </div>
              <div className={styles.chips} role="group" aria-label="Filtrar por estado">
                {statusFilters.map((f) => (
                  <button key={f.id} type="button" aria-pressed={status === f.id} onClick={() => setStatus(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {orders.length === 0 ? (
              <p className={styles.empty}>No hay órdenes {status === "todas" ? "en este período" : "con ese estado"}.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Fecha</th>
                      <th>Comprador</th>
                      <th>Evento</th>
                      <th className={styles.num}>Entradas</th>
                      <th className={styles.num}>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className={styles.code}>
                          {o.code}
                          {o.kind !== "sale" && <span className={styles.kind}>{orderKindLabels[o.kind]}</span>}
                        </td>
                        <td>{formatDateTime(o.created_at)}</td>
                        <td>
                          <span className={styles.buyer}>{o.buyer_name || o.buyer_email}</span>
                          {o.buyer_name && <span className={styles.sub}>{o.buyer_email}</span>}
                        </td>
                        <td>{o.event_title}</td>
                        <td className={styles.num}>{o.quantity}</td>
                        <td className={styles.num}>{o.kind === "sale" ? clp(o.total) : "—"}</td>
                        <td>
                          <span className={styles.status} data-status={o.status}>
                            {orderStatusLabels[o.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
