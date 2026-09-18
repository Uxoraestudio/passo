import { salesSeries } from "@/lib/dashboard-data";
import styles from "./SalesChart.module.css";

const VIEW_W = 640;
const VIEW_H = 200;
const PAD_X = 34;
const PAD_TOP = 10;
const PAD_BOTTOM = 24;
const PLOT_W = VIEW_W - PAD_X * 2;
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM;

const SALES_MAX = 2000;
const REVENUE_MAX = 8;

const salesAxis = ["2.000", "1.500", "1.000", "500", "0"];
const revenueAxis = ["$ 8M", "$ 6M", "$ 4M", "$ 2M", "$ 0"];

function pointsFor(values: number[], max: number) {
  return values.map((value, index) => {
    const x = PAD_X + (index / (values.length - 1)) * PLOT_W;
    const y = PAD_TOP + PLOT_H - (Math.min(value, max) / max) * PLOT_H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
}

export default function SalesChart() {
  const salesPoints = pointsFor(
    salesSeries.map((d) => d.sales),
    SALES_MAX
  );
  const revenuePoints = pointsFor(
    salesSeries.map((d) => d.revenue),
    REVENUE_MAX
  );

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Ventas e ingresos</h3>
          <p className={styles.subtitle}>
            Evolución de ventas en el período
            <br />
            seleccionado.
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.dot} data-color="purple" />
              Ventas
              <br />
              (entradas)
            </span>
            <span className={styles.legendItem}>
              <span className={styles.dot} data-color="orange" />
              Ingresos
              <br />
              (CLP)
            </span>
          </div>
          <div className={styles.toggle}>
            <button type="button">Día</button>
            <button type="button">Semana</button>
            <button type="button" data-active="true">
              Mes
            </button>
          </div>
        </div>
      </div>

      <div className={styles.chartArea}>
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" className={styles.svg} role="img" aria-label="Gráfico de ventas e ingresos por fecha">
          {salesAxis.map((_, i) => {
            const y = PAD_TOP + (i / (salesAxis.length - 1)) * PLOT_H;
            return <line key={i} x1={PAD_X} x2={VIEW_W - PAD_X} y1={y} y2={y} className={styles.gridLine} />;
          })}

          {salesAxis.map((label, i) => {
            const y = PAD_TOP + (i / (salesAxis.length - 1)) * PLOT_H;
            return (
              <text key={label} x={PAD_X - 6} y={y + 4} textAnchor="end" className={styles.axisLabelSales}>
                {label}
              </text>
            );
          })}
          {revenueAxis.map((label, i) => {
            const y = PAD_TOP + (i / (revenueAxis.length - 1)) * PLOT_H;
            return (
              <text key={label} x={VIEW_W - PAD_X + 6} y={y + 4} textAnchor="start" className={styles.axisLabelRevenue}>
                {label}
              </text>
            );
          })}

          <polyline points={revenuePoints.join(" ")} className={styles.lineRevenue} />
          <polyline points={salesPoints.join(" ")} className={styles.lineSales} />
        </svg>
      </div>

      <div className={styles.xAxis}>
        {salesSeries.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}
