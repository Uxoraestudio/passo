"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./SalesChart.module.css";

export type SalesDay = { day: string; tickets: number; revenue: number };
type Metric = "tickets" | "revenue";

const HEIGHT = 240;
const PAD = { top: 14, right: 16, bottom: 30, left: 56 };
const STEPS = 4;

const dayLabel = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", timeZone: "UTC" });
const dayLong = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const clp = (v: number) => `$ ${Math.round(v).toLocaleString("es-CL")}`;
const asDate = (day: string) => new Date(`${day}T00:00:00Z`);

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
  return `$ ${Math.round(value)}`;
}

/** Smooth line through the points that never overshoots (monotone cubic), so it can't dip below zero. */
function smoothPath(pts: [number, number][]) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const n = pts.length;
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0]);
  const slope = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / dx[i]);
  const tangent = pts.map((_, i) => {
    if (i === 0) return slope[0];
    if (i === n - 1) return slope[n - 2];
    if (slope[i - 1] * slope[i] <= 0) return 0;
    return (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]);
  });
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${(pts[i][0] + h).toFixed(1)},${(pts[i][1] + h * tangent[i]).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)},${(pts[i + 1][1] - h * tangent[i + 1]).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

/** Measures the element so the SVG is drawn at its real pixel size: text never stretches. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export default function SalesChart({ days, subtitle = "Evolución diaria en el período seleccionado." }: { days: SalesDay[]; subtitle?: string }) {
  const gradientId = useId();
  const [metric, setMetric] = useState<Metric>("tickets");
  const [hover, setHover] = useState<number | null>(null);
  const [areaRef, width] = useWidth<HTMLDivElement>();

  const values = days.map((d) => d[metric]);
  // A readable step (1, 2, 2.5, 5 × 10^n) times 4 gridlines; ticket steps are whole numbers.
  const top = Math.max(...values, 0);
  const max = metric === "tickets" ? Math.max(1, Math.ceil(niceMax(top / STEPS))) * STEPS : niceMax(Math.max(top, 100_000) / STEPS) * STEPS;
  const empty = days.every((d) => d.tickets === 0);
  const color = metric === "tickets" ? "purple" : "orange";

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const xAt = (i: number) => PAD.left + (days.length <= 1 ? plotW / 2 : (i / (days.length - 1)) * plotW);
  const yAt = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const points = values.map((v, i) => [xAt(i), yAt(v)] as [number, number]);
  const line = smoothPath(points);
  const baseline = PAD.top + plotH;
  const area = points.length > 1 ? `${line} L${points[points.length - 1][0].toFixed(1)},${baseline} L${points[0][0].toFixed(1)},${baseline} Z` : "";

  // Label as many days as fit (about one per 64px).
  const labelEvery = Math.max(1, Math.ceil(days.length / Math.max(2, Math.floor(plotW / 64))));
  const lastRegular = Math.floor((days.length - 1) / labelEvery) * labelEvery;
  const showLabel = (i: number) => i % labelEvery === 0 || (i === days.length - 1 && xAt(i) - xAt(lastRegular) >= 56);
  const ticks = Array.from({ length: STEPS + 1 }, (_, i) => (max * i) / STEPS);
  const fmtTick = (v: number) => (metric === "tickets" ? Math.round(v).toLocaleString("es-CL") : compactClp(v));

  const pickIndex = (clientX: number, rect: DOMRect) => {
    if (days.length === 0) return null;
    const x = clientX - rect.left - PAD.left;
    return Math.max(0, Math.min(days.length - 1, Math.round(days.length <= 1 ? 0 : (x / plotW) * (days.length - 1))));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (days.length === 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 1 : -1;
      setHover((h) => Math.max(0, Math.min(days.length - 1, h === null ? (step > 0 ? 0 : days.length - 1) : h + step)));
    } else if (e.key === "Escape") setHover(null);
  };

  const active = hover !== null ? days[hover] : null;
  // Restart the draw animation whenever the series or the data changes.
  const animKey = `${metric}-${days.length}-${values.join(",")}`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Ventas e ingresos</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.toggle} role="group" aria-label="Qué mostrar en el gráfico">
          <button type="button" aria-pressed={metric === "tickets"} data-color="purple" onClick={() => setMetric("tickets")}>
            Entradas
          </button>
          <button type="button" aria-pressed={metric === "revenue"} data-color="orange" onClick={() => setMetric("revenue")}>
            Ingresos
          </button>
        </div>
      </div>

      <div ref={areaRef} className={styles.chartArea}>
        {empty && <p className={styles.empty}>Aún no hay ventas pagadas en este período.</p>}
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            className={styles.svg}
            role="img"
            aria-label={`Gráfico de ${metric === "tickets" ? "entradas vendidas" : "ingresos"} por día. Usa las flechas para recorrer los días.`}
            tabIndex={days.length > 0 ? 0 : -1}
            onKeyDown={onKey}
            onBlur={() => setHover(null)}
            onPointerMove={(e) => setHover(pickIndex(e.clientX, e.currentTarget.getBoundingClientRect()))}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" className={styles.gradTop} data-color={color} />
                <stop offset="100%" className={styles.gradBottom} data-color={color} />
              </linearGradient>
            </defs>

            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + plotW} y1={yAt(t)} y2={yAt(t)} className={t === 0 ? styles.baseLine : styles.gridLine} />
                <text x={PAD.left - 10} y={yAt(t)} dy="0.35em" textAnchor="end" className={styles.axisLabel}>
                  {fmtTick(t)}
                </text>
              </g>
            ))}

            {days.map((d, i) =>
              showLabel(i) ? (
                <text key={d.day} x={xAt(i)} y={HEIGHT - 8} textAnchor={i === 0 && days.length > 1 ? "start" : i === days.length - 1 && days.length > 1 ? "end" : "middle"} className={styles.axisLabel}>
                  {dayLabel.format(asDate(d.day))}
                </text>
              ) : null
            )}

            {days.length > 0 && (
              <g key={animKey}>
                {area && <path d={area} fill={`url(#${gradientId})`} className={styles.area} />}
                <path d={line} pathLength={1} className={styles.line} data-color={color} />
              </g>
            )}

            {active && hover !== null && (
              <g pointerEvents="none">
                <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.top} y2={baseline} className={styles.crosshair} />
                <circle cx={xAt(hover)} cy={yAt(values[hover])} r={5} className={styles.marker} data-color={color} />
              </g>
            )}
          </svg>
        )}

        {active && hover !== null && (
          <div
            className={styles.tooltip}
            style={{ left: Math.min(Math.max(xAt(hover), 90), width - 90), top: Math.max(0, yAt(values[hover]) - 14) }}
            aria-hidden="true"
          >
            <span className={styles.tooltipDay}>{dayLong.format(asDate(active.day))}</span>
            <span className={styles.tooltipRow} data-active={metric === "tickets" || undefined}>
              <span className={styles.dot} data-color="purple" />
              Entradas <b>{active.tickets.toLocaleString("es-CL")}</b>
            </span>
            <span className={styles.tooltipRow} data-active={metric === "revenue" || undefined}>
              <span className={styles.dot} data-color="orange" />
              Ingresos <b>{clp(active.revenue)}</b>
            </span>
          </div>
        )}
      </div>

      {/* The same numbers as a table, for screen readers. */}
      <table className={styles.srOnly}>
        <caption>Entradas vendidas e ingresos por día</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Entradas</th>
            <th scope="col">Ingresos</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <th scope="row">{dayLong.format(asDate(d.day))}</th>
              <td>{d.tickets.toLocaleString("es-CL")}</td>
              <td>{clp(d.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
