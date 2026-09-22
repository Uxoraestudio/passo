import { MaterialIcon } from "@/components/icons";
import styles from "./EventsKpiRow.module.css";

const kpis = [
  {
    id: "total",
    label: "Total de eventos",
    value: "12",
    icon: "calendar_month",
    tone: "purple",
    delta: "+3 este trimestre",
    deltaTone: "purple",
    caption: "Catálogo 2025/26",
  },
  {
    id: "en-venta",
    label: "Eventos en venta",
    value: "4",
    icon: "bolt",
    tone: "teal",
    delta: "100% puertas en red",
    deltaTone: "success",
    caption: "Check-in activo",
  },
  {
    id: "aforo",
    label: "Aforo total disponible",
    value: "48.500",
    icon: "stadium",
    tone: "orange",
    delta: "68.4% ocupado",
    deltaTone: "orange",
    caption: "Suma de sedes",
  },
  {
    id: "recaudacion",
    label: "Recaudación estimada",
    value: "$248.5M",
    icon: "account_balance_wallet",
    tone: "neutral",
    delta: "+24.8% vs proy.",
    deltaTone: "success",
    caption: "Pesos Chilenos (CLP)",
  },
];

export default function EventsKpiRow() {
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
