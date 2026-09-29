import { MaterialIcon } from "@/components/icons";
import type { EventRecord } from "@/lib/events-data";
import styles from "./EventsKpiRow.module.css";

const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;

export default function EventsKpiRow({ events }: { events: EventRecord[] }) {
  const total = events.length;
  const enVenta = events.filter((e) => e.status === "en-venta" || e.status === "casi-agotado").length;
  const aforoTotal = events.reduce((sum, e) => sum + e.capacity, 0);
  const aforoVendido = events.reduce((sum, e) => sum + e.sold, 0);
  const ocupacion = aforoTotal > 0 ? Math.round((aforoVendido / aforoTotal) * 100) : 0;
  const recaudacion = events.reduce((sum, e) => sum + e.sold * e.price_base, 0);

  const kpis = [
    {
      id: "total",
      label: "Total de eventos",
      value: String(total),
      icon: "calendar_month",
      tone: "purple",
      delta: `${events.filter((e) => e.status !== "finalizado").length} activos`,
      deltaTone: "purple",
      caption: "Catálogo actual",
    },
    {
      id: "en-venta",
      label: "Eventos en venta",
      value: String(enVenta),
      icon: "bolt",
      tone: "teal",
      delta: total > 0 ? `${Math.round((enVenta / total) * 100)}%` : "0%",
      deltaTone: "success",
      caption: "Del catálogo",
    },
    {
      id: "aforo",
      label: "Aforo total disponible",
      value: aforoTotal.toLocaleString("es-CL"),
      icon: "stadium",
      tone: "orange",
      delta: `${ocupacion}% ocupado`,
      deltaTone: "orange",
      caption: "Suma de sedes",
    },
    {
      id: "recaudacion",
      label: "Recaudación estimada",
      value: currency(recaudacion),
      icon: "account_balance_wallet",
      tone: "neutral",
      delta: `${aforoVendido.toLocaleString("es-CL")} vendidas`,
      deltaTone: "success",
      caption: "Pesos Chilenos (CLP)",
    },
  ];

  return (
    <div className={styles.grid}>
      {kpis.map((kpi) => (
        <div key={kpi.id} className={styles.card}>
          <div className={styles.blob} data-tone={kpi.tone} />
          <div className={styles.header}>
            <span className={styles.label}>{kpi.label}</span>
            <span className={styles.iconBox} data-tone={kpi.tone}>
              <MaterialIcon name={kpi.icon} className={styles.icon} />
            </span>
          </div>
          <div className={styles.value}>{kpi.value}</div>
          <div className={styles.footer}>
            <span className={styles.delta} data-tone={kpi.deltaTone}>
              {kpi.delta}
            </span>
            <span className={styles.caption}>{kpi.caption}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
