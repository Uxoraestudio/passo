"use client";

import { memo, useMemo, type KeyboardEvent } from "react";
import type { EventPlan, PlanSeat, PlanSector } from "@/lib/seat-plan-types";
import { PlanElements } from "./PlanMap";
import styles from "./PlanSeatPicker.module.css";

// Seats of one plan sector, framed around the sector with the rest of the plan
// faded behind it. Each available seat is a button; held, sold and blocked
// seats are shown as taken.

/** Typical distance to the nearest neighbour (sampled), in plan pixels. */
function seatPitch(seats: PlanSeat[], w: number, h: number) {
  const sample = seats.slice(0, 80);
  const dists: number[] = [];
  for (const a of sample) {
    let best = Infinity;
    for (const b of seats) {
      if (a === b) continue;
      const d = Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);
      if (d > 0 && d < best) best = d;
    }
    if (Number.isFinite(best)) dists.push(best);
  }
  dists.sort((x, y) => x - y);
  return dists.length ? dists[Math.floor(dists.length / 2)] : Math.min(w, h) / 60;
}

const stateText: Record<PlanSeat["state"], string> = {
  AVAILABLE: "disponible",
  HELD: "reservado por otra persona",
  SOLD: "vendido",
  BLOCKED: "no disponible",
};

const Seat = memo(function Seat({
  seat,
  r,
  w,
  h,
  selected,
  color,
  onToggle,
}: {
  seat: PlanSeat;
  r: number;
  w: number;
  h: number;
  selected: boolean;
  color: string;
  onToggle: (seat: PlanSeat) => void;
}) {
  const available = seat.state === "AVAILABLE";
  const status = selected ? "selected" : available ? "available" : "taken";
  const where = seat.rowLabel && seat.number != null ? `Fila ${seat.rowLabel}, asiento ${seat.number}` : `Asiento ${seat.label}`;
  const onKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(seat);
    }
  };
  return (
    <g
      className={styles.seat}
      data-status={status}
      data-kind={seat.kind}
      role="button"
      tabIndex={available ? 0 : -1}
      aria-disabled={!available}
      aria-pressed={selected}
      aria-label={`${where}${seat.kind === "ACCESSIBLE" ? ", accesible" : seat.kind === "OBSTRUCTED" ? ", visión reducida" : ""}, ${selected ? "seleccionado" : stateText[seat.state]}`}
      onClick={available ? () => onToggle(seat) : undefined}
      onKeyDown={available ? onKey : undefined}
      style={{ ["--seat" as string]: color }}
    >
      <circle cx={seat.x * w} cy={seat.y * h} r={r} />
      {seat.kind === "ACCESSIBLE" && !selected && (
        <text x={seat.x * w} y={seat.y * h} className={styles.mark} style={{ fontSize: r * 1.2 }} aria-hidden="true">
          ♿
        </text>
      )}
    </g>
  );
});

export default function PlanSeatPicker({
  plan,
  sector,
  selected,
  zoom,
  onToggle,
}: {
  plan: EventPlan;
  sector: PlanSector;
  selected: string[];
  zoom: number;
  onToggle: (seat: PlanSeat) => void;
}) {
  const w = plan.width;
  const h = plan.height;
  const r = useMemo(() => seatPitch(sector.seats, w, h) * 0.4, [sector.seats, w, h]);

  // Frame the sector (and its seats) with some margin around it.
  const viewBox = useMemo(() => {
    const xs = [...sector.polygon.map((p) => p[0]), ...sector.seats.map((s) => s.x)].map((x) => x * w);
    const ys = [...sector.polygon.map((p) => p[1]), ...sector.seats.map((s) => s.y)].map((y) => y * h);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = Math.max(maxX - minX, maxY - minY) * 0.12 + r * 3;
    return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
  }, [sector, w, h, r]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div className={styles.frame}>
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className={styles.svg}
        style={{ width: `${zoom * 100}%` }}
        role="group"
        aria-label={`Asientos de ${sector.name}`}
      >
        {plan.imageUrl && <image href={plan.imageUrl} x={0} y={0} width={w} height={h} preserveAspectRatio="none" opacity={0.3} />}
        <PlanElements elements={plan.elements} w={w} h={h} />
        {plan.sectors
          .filter((s) => s.id !== sector.id)
          .map((s) => (
            <polygon key={s.id} points={s.polygon.map(([x, y]) => `${x * w},${y * h}`).join(" ")} className={styles.otherSector} />
          ))}
        <polygon points={sector.polygon.map(([x, y]) => `${x * w},${y * h}`).join(" ")} className={styles.currentSector} style={{ ["--sector" as string]: sector.color }} />
        {sector.seats.map((seat) => (
          <Seat key={seat.label} seat={seat} r={r} w={w} h={h} selected={selectedSet.has(seat.label)} color={sector.color} onToggle={onToggle} />
        ))}
      </svg>
    </div>
  );
}
