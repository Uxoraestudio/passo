import { BarsIcon, CalendarIcon, ScanIcon, SparkleIcon, UsersIcon } from "@/components/icons";
import { recentActivity, type ActivityKind } from "@/lib/dashboard-data";
import styles from "./RecentActivity.module.css";

const iconByKind: Record<ActivityKind, typeof BarsIcon> = {
  venta: BarsIcon,
  validacion: ScanIcon,
  cliente: UsersIcon,
  evento: CalendarIcon,
};

const colorByKind: Record<ActivityKind, "purple" | "orange"> = {
  venta: "orange",
  validacion: "purple",
  cliente: "purple",
  evento: "orange",
};

export default function RecentActivity() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <SparkleIcon className={styles.headerIcon} />
        <div>
          <h3 className={styles.title}>Actividad reciente</h3>
          <p className={styles.subtitle}>Últimos movimientos en la plataforma.</p>
        </div>
      </div>

      <ul className={styles.list}>
        {recentActivity.map((item) => {
          const Icon = iconByKind[item.kind];
          return (
            <li key={item.id} className={styles.item}>
              <span className={styles.iconBox} data-color={colorByKind[item.kind]}>
                <Icon className={styles.icon} />
              </span>
              <div className={styles.itemBody}>
                <p className={styles.itemText}>{item.text}</p>
                <p className={styles.itemTime}>{item.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
