import { ticketCategories, ticketCategoriesTotal } from "@/lib/dashboard-data";
import styles from "./CategoryDonut.module.css";

const SIZE = 144;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function withOffsets() {
  let acc = 0;
  return ticketCategories.map((cat) => {
    const offset = acc;
    acc += cat.percent;
    return { ...cat, offset };
  });
}

export default function CategoryDonut() {
  const segments = withOffsets();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Entradas por categoría</h3>
        <p className={styles.subtitle}>Distribución de entradas vendidas.</p>
      </div>

      <div className={styles.donutRow}>
        <div className={styles.donutWrap}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.svg} role="img" aria-label="Distribución de entradas por categoría">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
            {segments.map((cat) => {
              const dash = (cat.percent / 100) * CIRCUMFERENCE;
              const dashArray = `${dash} ${CIRCUMFERENCE - dash}`;
              const dashOffset = -((cat.offset / 100) * CIRCUMFERENCE);
              return (
                <circle
                  key={cat.id}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth={STROKE}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>
          <div className={styles.center}>
            <span className={styles.centerValue}>{ticketCategoriesTotal.toLocaleString("es-CL")}</span>
            <span className={styles.centerLabel}>entradas</span>
          </div>
        </div>
      </div>

      <ul className={styles.list}>
        {ticketCategories.map((cat) => (
          <li key={cat.id} className={styles.item}>
            <span className={styles.itemLeft}>
              <span className={styles.swatch} style={{ background: cat.color }} />
              {cat.label}
            </span>
            <span className={styles.itemRight}>
              <span className={styles.percent}>{cat.percent}%</span>
              <span className={styles.value}>{cat.value.toLocaleString("es-CL")}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
