import { BarsIcon, CalendarIcon, SparkleIcon, TicketIcon, UsersIcon } from "@/components/icons";
import styles from "./RecentActivity.module.css";

export type ActivityKind = "venta" | "cortesia" | "cliente" | "evento";

export type ActivityItem = { id: string; kind: ActivityKind; text: string; time: string };

const iconByKind: Record<ActivityKind, typeof BarsIcon> = {
  venta: BarsIcon,
  cortesia: TicketIcon,
  cliente: UsersIcon,
  evento: CalendarIcon,
};

const colorByKind: Record<ActivityKind, "purple" | "orange"> = {
  venta: "orange",
  cortesia: "purple",
  cliente: "purple",
  evento: "orange",
};

export default function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <SparkleIcon className={styles.headerIcon} />
        <div>
          <h3 className={styles.title}>Actividad reciente</h3>
          <p className={styles.subtitle}>Últimas ventas, cortesías y registros.</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className={styles.subtitle}>Todavía no hay movimientos.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => {
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
      )}
    </div>
  );
}
