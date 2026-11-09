import Select from "@/components/Select";
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
          <Select
            aria-label="Recinto"
            icon={<MaterialIcon name="location_on" decorative />}
            value={venue}
            onChange={onVenueChange}
            options={[{ value: "", label: "Todos los recintos" }, ...venues.map((v) => ({ value: v, label: v }))]}
          />
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
