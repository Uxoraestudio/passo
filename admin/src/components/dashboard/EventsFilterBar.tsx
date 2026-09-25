import { MaterialIcon } from "@/components/icons";
import styles from "./EventsFilterBar.module.css";

export type FilterTab = "todos" | "activos" | "borradores" | "finalizados";

export default function EventsFilterBar({
  tab,
  onTabChange,
  counts,
  venue,
  onVenueChange,
  search,
  onSearchChange,
  venues,
}: {
  tab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  counts: Record<FilterTab, number>;
  venue: string;
  onVenueChange: (venue: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  venues: string[];
}) {
  const tabs: { id: FilterTab; label: string; dot?: string }[] = [
    { id: "todos", label: `Todos (${counts.todos})` },
    { id: "activos", label: `Activos (${counts.activos})`, dot: "var(--color-success)" },
    { id: "borradores", label: `Borradores (${counts.borradores})`, dot: "var(--color-icon-muted)" },
    { id: "finalizados", label: `Finalizados (${counts.finalizados})`, dot: "var(--color-purple)" },
  ];

  return (
    <div className={styles.bar}>
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={styles.tab}
            data-active={tab === t.id}
            onClick={() => onTabChange(t.id)}
          >
            {t.dot && <span className={styles.dot} style={{ background: t.dot }} />}
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.filters}>
        <div className={styles.selectWrap}>
          <MaterialIcon name="location_on" className={styles.selectIcon} />
          <select className={styles.select} value={venue} onChange={(e) => onVenueChange(e.target.value)}>
            <option value="">Todos los recintos</option>
            {venues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <MaterialIcon name="expand_more" className={styles.chevron} />
        </div>
        <div className={styles.searchWrap}>
          <MaterialIcon name="search" className={styles.selectIcon} />
          <input
            type="text"
            className={styles.search}
            placeholder="Filtrar por artista o sede..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
