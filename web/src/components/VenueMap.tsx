"use client";

import type { TicketTier } from "@/lib/eventDetails";
import styles from "./VenueMap.module.css";

const CX = 200;
const STAGE_Y = 14;
const STAGE_H = 30;
const STAGE_W = 160;
const BAND_GAP = 8;
const BAND_H = 62;
const BASE_TOP_W = 130;
const STEP_W = 48;

function bandPoints(index: number) {
  const topW = BASE_TOP_W + index * STEP_W;
  const bottomW = topW + STEP_W;
  const y = STAGE_Y + STAGE_H + 26 + index * (BAND_H + BAND_GAP);
  const topLeft = CX - topW / 2;
  const topRight = CX + topW / 2;
  const bottomLeft = CX - bottomW / 2;
  const bottomRight = CX + bottomW / 2;
  const bottomY = y + BAND_H;
  return {
    points: `${topLeft},${y} ${topRight},${y} ${bottomRight},${bottomY} ${bottomLeft},${bottomY}`,
    labelY: y + BAND_H / 2,
  };
}

export default function VenueMap({
  tiers,
  activeIds,
  onSelect,
}: {
  tiers: TicketTier[];
  activeIds: string[];
  onSelect: (id: string) => void;
}) {
  const viewHeight = STAGE_Y + STAGE_H + 26 + tiers.length * (BAND_H + BAND_GAP) + 20;

  return (
    <svg
      viewBox={`0 0 400 ${viewHeight}`}
      className={styles.svg}
      role="img"
      aria-label="Mapa interactivo del recinto"
    >
      <rect
        x={CX - STAGE_W / 2}
        y={STAGE_Y}
        width={STAGE_W}
        height={STAGE_H}
        rx={10}
        className={styles.stage}
      />
      <text x={CX} y={STAGE_Y + STAGE_H / 2 + 4} textAnchor="middle" className={styles.stageLabel}>
        ESCENARIO
      </text>

      {tiers.map((tier, index) => {
        const { points, labelY } = bandPoints(index);
        const active = activeIds.includes(tier.id);
        return (
          <g
            key={tier.id}
            className={styles.band}
            data-active={active}
            onClick={() => onSelect(tier.id)}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`${tier.name}, $${tier.price.toLocaleString("es-CL")}`}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(tier.id);
              }
            }}
          >
            <polygon
              points={points}
              fill={tier.color}
              fillOpacity={active ? 0.92 : 0.5}
              stroke={active ? "#fff" : "transparent"}
              strokeWidth={active ? 3 : 0}
              className={styles.polygon}
            />
            <text x={CX} y={labelY - 4} textAnchor="middle" className={styles.bandLabel}>
              {tier.name}
            </text>
            <text x={CX} y={labelY + 14} textAnchor="middle" className={styles.bandPrice}>
              ${tier.price.toLocaleString("es-CL")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
