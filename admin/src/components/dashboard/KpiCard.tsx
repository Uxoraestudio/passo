import { BarsSolidIcon, CalendarSolidIcon, PieIcon, TicketSolidIcon, TrendUpIcon } from "@/components/icons";
import type { KpiDatum } from "@/lib/dashboard-data";
import styles from "./KpiCard.module.css";

const iconMap = {
  bars: BarsSolidIcon,
  ticket: TicketSolidIcon,
  calendar: CalendarSolidIcon,
  pie: PieIcon,
};

export default function KpiCard({ kpi }: { kpi: KpiDatum }) {
  const Icon = iconMap[kpi.icon];

  return (
    <div className={styles.card}>
      <div className={styles.iconBox} data-bg={kpi.iconBg}>
        <Icon className={styles.icon} />
      </div>
      <div className={styles.body}>
        <p className={styles.label}>{kpi.label}</p>
        <p className={styles.value}>{kpi.value}</p>
        <div className={styles.deltaRow}>
          <span className={styles.delta}>
            <TrendUpIcon className={styles.deltaIcon} />
            {kpi.delta}
          </span>
          <span className={styles.deltaCaption}>vs. período anterior</span>
        </div>
      </div>
    </div>
  );
}
