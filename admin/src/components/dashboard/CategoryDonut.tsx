import styles from "./CategoryDonut.module.css";

const SIZE = 144;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const PALETTE = ["#5b32e6", "#f95721", "#a78bfa", "#f59e0b", "#c4b5fd", "#94a3b8"];

export type CategorySlice = { category: string; tickets: number };

export default function CategoryDonut({ data }: { data: CategorySlice[] }) {
  // Keep the five biggest categories and fold the rest into "Otras".
  const top = data.slice(0, 5);
  const rest = data.slice(5).reduce((sum, c) => sum + c.tickets, 0);
  const slices = rest > 0 ? [...top, { category: "Otras", tickets: rest }] : top;
  const total = slices.reduce((sum, c) => sum + c.tickets, 0);

  const percents = slices.map((slice) => (total > 0 ? (slice.tickets / total) * 100 : 0));
  const segments = slices.map((slice, index) => ({
    ...slice,
    percent: percents[index],
    offset: percents.slice(0, index).reduce((sum, p) => sum + p, 0),
    color: PALETTE[index % PALETTE.length],
  }));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Entradas por categoría</h3>
        <p className={styles.subtitle}>Distribución de entradas vendidas en el período.</p>
      </div>
      <div className={styles.donutRow}>
        <div className={styles.donutWrap}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.svg} role="img" aria-label="Distribución de entradas por categoría">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
            {segments.map((seg) => {
              const dash = (seg.percent / 100) * CIRCUMFERENCE;
              return (
                <circle
                  key={seg.category}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  strokeDashoffset={-((seg.offset / 100) * CIRCUMFERENCE)}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>
          <div className={styles.center}>
            <span className={styles.centerValue}>{total.toLocaleString("es-CL")}</span>
            <span className={styles.centerLabel}>entradas</span>
          </div>
        </div>
      </div>
      {segments.length === 0 ? (
        <p className={styles.subtitle}>Las categorías aparecerán con las primeras ventas.</p>
      ) : (
        <ul className={styles.list}>
          {segments.map((seg) => (
            <li key={seg.category} className={styles.item}>
              <span className={styles.itemLeft}>
                <span className={styles.swatch} style={{ background: seg.color }} />
                {seg.category}
              </span>
              <span className={styles.itemRight}>
                <span className={styles.percent}>{Math.round(seg.percent)}%</span>
                <span className={styles.value}>{seg.tickets.toLocaleString("es-CL")}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
