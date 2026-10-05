import { BarsSolidIcon, CalendarSolidIcon, PieIcon, TicketSolidIcon, TrendUpIcon } from "@/components/icons";
import styles from "./KpiCard.module.css";

export type KpiDatum = {
  id: string;
  label: string;
  value: string;
  /** "+12%", "−5%", "Nuevo", or null when there's nothing to compare. */
  delta: string | null;
  caption?: string;
  iconBg: "purple" | "orange";
  icon: "bars" | "ticket" | "calendar" | "pie";
};

const iconMap = {
  bars: BarsSolidIcon,
  ticket: TicketSolidIcon,
  calendar: CalendarSolidIcon,
  pie: PieIcon,
};

export default function KpiCard({ kpi }: { kpi: KpiDatum }) {
  const Icon = iconMap[kpi.icon];
  const down = kpi.delta?.startsWith("−");
  return (
    <div className={styles.card}>
      <div className={styles.iconBox} data-bg={kpi.iconBg}>
        <Icon className={styles.icon} />
      </div>
      <div className={styles.body}>
        <p className={styles.label}>{kpi.label}</p>
        <p className={styles.value}>{kpi.value}</p>
        <div className={styles.deltaRow}>
          {kpi.delta && (
            <span className={styles.delta} data-down={down}>
              {!down && <TrendUpIcon className={styles.deltaIcon} />}
              {kpi.delta}
            </span>
          )}
          <span className={styles.deltaCaption}>{kpi.caption ?? "vs. período anterior"}</span>
        </div>
      </div>
    </div>
  );
}
