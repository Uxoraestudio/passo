import styles from "./SalesChart.module.css";

const VIEW_W = 640;
const VIEW_H = 200;
const PAD_X = 40;
const PAD_TOP = 10;
const PAD_BOTTOM = 24;
const PLOT_W = VIEW_W - PAD_X * 2;
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM;
const STEPS = 4;

export type SalesDay = { day: string; tickets: number; revenue: number };

const dayLabel = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", timeZone: "UTC" });

// Round the axis maximum up to a readable number (1, 2, 2.5, 5 × 10^n).
function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

function compactClp(value: number) {
  if (value >= 1_000_000) return `$ ${(value / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })}M`;
  if (value >= 1_000) return `$ ${Math.round(value / 1_000)}k`;
  return `$ ${value}`;
}

function pointsFor(values: number[], max: number) {
  return values.map((value, index) => {
    const x = PAD_X + (values.length === 1 ? PLOT_W / 2 : (index / (values.length - 1)) * PLOT_W);
    const y = PAD_TOP + PLOT_H - (value / max) * PLOT_H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
}

export default function SalesChart({ days, subtitle = "Evolución diaria en el período seleccionado." }: { days: SalesDay[]; subtitle?: string }) {
  // Ticket ticks must be whole numbers, so the max is a multiple of the step count.
  const ticketsMax = Math.ceil(niceMax(Math.max(...days.map((d) => d.tickets), STEPS)) / STEPS) * STEPS;
  const revenueMax = niceMax(Math.max(...days.map((d) => d.revenue), 100_000));
  const empty = days.every((d) => d.tickets === 0);
  const ticks = Array.from({ length: STEPS + 1 }, (_, i) => 1 - i / STEPS);
  const labelEvery = Math.max(1, Math.ceil(days.length / 8));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Ventas e ingresos</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.dot} data-color="purple" />
              Entradas
            </span>
            <span className={styles.legendItem}>
              <span className={styles.dot} data-color="orange" />
              Ingresos (CLP)
            </span>
          </div>
        </div>
      </div>
      <div className={styles.chartArea}>
        {empty && <p className={styles.empty}>Aún no hay ventas pagadas en este período.</p>}
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" className={styles.svg} role="img" aria-label="Gráfico de entradas vendidas e ingresos por día">
          {ticks.map((t) => {
            const y = PAD_TOP + (1 - t) * PLOT_H;
            return (
              <g key={t}>
                <line x1={PAD_X} x2={VIEW_W - PAD_X} y1={y} y2={y} className={styles.gridLine} />
                <text x={PAD_X - 6} y={y + 4} textAnchor="end" className={styles.axisLabelSales}>
                  {Math.round(ticketsMax * t).toLocaleString("es-CL")}
                </text>
                <text x={VIEW_W - PAD_X + 6} y={y + 4} textAnchor="start" className={styles.axisLabelRevenue}>
                  {compactClp(revenueMax * t)}
                </text>
              </g>
            );
          })}
          {days.length > 0 && (
            <>
              <polyline points={pointsFor(days.map((d) => d.revenue), revenueMax).join(" ")} className={styles.lineRevenue} />
              <polyline points={pointsFor(days.map((d) => d.tickets), ticketsMax).join(" ")} className={styles.lineSales} />
            </>
          )}
        </svg>
      </div>
      <div className={styles.xAxis} aria-hidden="true">
        {days.map((d, i) =>
          i % labelEvery === 0 ? (
            <span key={d.day} style={{ left: `${days.length === 1 ? 50 : (i / (days.length - 1)) * 100}%` }}>
              {dayLabel.format(new Date(`${d.day}T00:00:00Z`))}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}
