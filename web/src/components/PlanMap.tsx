"use client";

import type { KeyboardEvent } from "react";
import { centroid, type EventPlan, type PlanElement } from "@/lib/seat-plan-types";
import styles from "./PlanMap.module.css";

const ELEMENT_COLORS: Record<PlanElement["kind"], string> = {
  STAGE: "#1c1a2a",
  ENTRANCE: "#059669",
  EXIT: "#dc2626",
  BAR: "#ca8a04",
  BATHROOM: "#2563eb",
  TEXT: "#1c1a2a",
};

/** Stage, bars and other plan elements (areas as boxes, markers as dots). */
export function PlanElements({ elements, w, h }: { elements: PlanElement[]; w: number; h: number }) {
  return (
    <g aria-hidden="true">
      {elements.map((e, i) => {
        const g = e.geometry;
        const color = e.color ?? ELEMENT_COLORS[e.kind];
        if ((e.shape === "rect" || e.shape === "ellipse") && g.x != null && g.y != null && g.w != null && g.h != null) {
          const cx = (g.x + g.w / 2) * w;
          const cy = (g.y + g.h / 2) * h;
          return (
            <g key={i} transform={`rotate(${e.rotation} ${cx} ${cy})`}>
              {e.shape === "rect" ? (
                <rect x={g.x * w} y={g.y * h} width={g.w * w} height={g.h * h} rx={Math.min(w, h) * 0.01} fill={color} />
              ) : (
                <ellipse cx={cx} cy={cy} rx={(g.w * w) / 2} ry={(g.h * h) / 2} fill={color} />
              )}
              {e.label && (
                <text x={cx} y={cy} className={styles.elementLabel} style={{ fontSize: Math.max(10, Math.min(w, h) / 40) }}>
                  {e.label.toUpperCase()}
                </text>
              )}
            </g>
          );
        }
        if (e.shape === "point" && g.x != null && g.y != null) {
          const r = Math.min(w, h) / 90;
          return e.kind === "TEXT" ? (
            <text key={i} x={g.x * w} y={g.y * h} className={styles.textLabel} style={{ fontSize: r * 2.2, fill: color }}>
              {e.label}
            </text>
          ) : (
            <circle key={i} cx={g.x * w} cy={g.y * h} r={r} fill={color} stroke="#fff" strokeWidth={r * 0.3} />
          );
        }
        return null;
      })}
    </g>
  );
}

export default function PlanMap({
  plan,
  activeIds = [],
  soldOutIds = [],
  onSelect,
  label = "Plano del recinto",
}: {
  plan: EventPlan;
  /** Sectors highlighted (e.g. already in the buyer's selection). */
  activeIds?: string[];
  soldOutIds?: string[];
  /** When set, sectors are buttons. */
  onSelect?: (sectorId: string) => void;
  label?: string;
}) {
  const w = plan.width;
  const h = plan.height;
  const fontSize = Math.max(11, Math.min(w, h) / 34);

  const onKey = (e: KeyboardEvent<SVGGElement>, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.map} role="group" aria-label={label}>
      {plan.imageUrl && <image href={plan.imageUrl} x={0} y={0} width={w} height={h} preserveAspectRatio="none" opacity={0.55} />}
      <PlanElements elements={plan.elements} w={w} h={h} />
      {plan.sectors.map((s) => {
        const [cx, cy] = s.labelPoint ?? centroid(s.polygon);
        // Fit the label inside the sector: shrink it, and write it vertically in tall, narrow sectors.
        const xs = s.polygon.map((p) => p[0] * w);
        const ys = s.polygon.map((p) => p[1] * h);
        const boxW = Math.max(...xs) - Math.min(...xs);
        const boxH = Math.max(...ys) - Math.min(...ys);
        const name = s.shortLabel || s.name;
        const fitAcross = (boxW * 0.9) / (name.length * 0.6);
        const vertical = fitAcross < fontSize * 0.75 && boxH > boxW * 1.5;
        const size = Math.max(8, Math.min(fontSize, vertical ? (boxH * 0.85) / (name.length * 0.6) : fitAcross));
        const transform = vertical ? `rotate(-90 ${cx * w} ${cy * h})` : undefined;
        const soldOut = soldOutIds.includes(s.id);
        const interactive = Boolean(onSelect) && !soldOut;
        return (
          <g
            key={s.id}
            className={styles.sector}
            data-active={activeIds.includes(s.id)}
            data-soldout={soldOut}
            data-interactive={interactive}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `${s.name}${s.price ? `, desde $${s.price.toLocaleString("es-CL")}` : ""}` : undefined}
            aria-pressed={interactive ? activeIds.includes(s.id) : undefined}
            onClick={interactive ? () => onSelect?.(s.id) : undefined}
            onKeyDown={interactive ? (e) => onKey(e, s.id) : undefined}
          >
            <polygon points={s.polygon.map(([x, y]) => `${x * w},${y * h}`).join(" ")} style={{ fill: soldOut ? "#475569" : s.color, ["--sector" as string]: soldOut ? "#475569" : s.color }} />
            <text x={cx * w} y={cy * h - size * 0.55} className={styles.sectorName} style={{ fontSize: size }} transform={transform}>
              {name}
            </text>
            <text x={cx * w} y={cy * h + size * 0.75} className={styles.sectorMeta} style={{ fontSize: size * 0.8 }} transform={transform}>
              {soldOut ? "Agotado" : s.price ? `$${s.price.toLocaleString("es-CL")}` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
