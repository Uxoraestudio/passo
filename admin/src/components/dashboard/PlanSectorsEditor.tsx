"use client";

import type { KeyboardEvent } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/icons";
import type { MapElement, Point, VenueMap } from "@/lib/venue-map-types";
import { venueMapImageUrl } from "@/lib/venue-maps-data";
import { sectorIssue, type SectorDraft } from "./PerimetryEditor";
import styles from "./EventFormPage.module.css";

// Sectors of an event that uses a published venue plan: the plan fixes names,
// shapes and capacity; here the organiser only sets each sector's price and
// whether it goes on sale.

function centre(points: Point[]): Point {
  const n = points.length || 1;
  return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
}

function toAmount(raw: string): number | "" {
  if (raw === "") return "";
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? Math.max(0, n) : "";
}

function ElementMark({ e, w, h }: { e: MapElement; w: number; h: number }) {
  const g = e.geometry;
  if (g.shape === "rect" || g.shape === "ellipse") {
    const cx = (g.x + g.w / 2) * w;
    const cy = (g.y + g.h / 2) * h;
    return (
      <g transform={`rotate(${e.rotation} ${cx} ${cy})`} aria-hidden="true">
        <rect x={g.x * w} y={g.y * h} width={g.w * w} height={g.h * h} rx={6} style={{ fill: e.color ?? "#1c1a2a", opacity: 0.9 }} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: Math.max(10, h / 40) }}>
          {(e.label ?? "").toUpperCase()}
        </text>
      </g>
    );
  }
  return null;
}

export default function PlanSectorsEditor({
  plan,
  sectors,
  onChange,
  showErrors,
}: {
  plan: VenueMap;
  sectors: SectorDraft[];
  onChange: (sectors: SectorDraft[]) => void;
  showErrors: boolean;
}) {
  const w = plan.imageWidth;
  const h = plan.imageHeight;
  const update = (key: string, patch: Partial<SectorDraft>) => onChange(sectors.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const toggle = (key: string) => onChange(sectors.map((s) => (s.key === key ? { ...s, is_active: !s.is_active } : s)));
  const onSectorKey = (e: KeyboardEvent<SVGGElement>, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(key);
    }
  };

  const active = sectors.filter((s) => s.is_active);
  const activeCap = active.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
  const totalCap = sectors.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);

  return (
    <div className={styles.mapWrap}>
      <div className={styles.map}>
        <svg viewBox={`0 0 ${w} ${h}`} role="group" aria-label={`Plano versión ${plan.version}`}>
          {plan.imagePath && <image href={venueMapImageUrl(plan.imagePath)} x={0} y={0} width={w} height={h} preserveAspectRatio="none" opacity={0.85} />}
          {plan.elements.map((e) => (
            <ElementMark key={e.id} e={e} w={w} h={h} />
          ))}
          {sectors.map((s) => {
            if (!s.polygon || s.polygon.length < 3) return null;
            const [cx, cy] = centre(s.polygon);
            const fontSize = Math.max(11, Math.min(w, h) / 38);
            return (
              <g
                key={s.key}
                className={styles.sector}
                data-off={!s.is_active}
                role="button"
                tabIndex={0}
                aria-pressed={s.is_active}
                aria-label={`${s.name}: ${s.is_active ? "a la venta" : "no se vende"}`}
                onClick={() => toggle(s.key)}
                onKeyDown={(e) => onSectorKey(e, s.key)}
              >
                <polygon points={s.polygon.map(([x, y]) => `${x * w},${y * h}`).join(" ")} style={{ fill: `${s.color}cc`, stroke: s.color, strokeWidth: 2 }} />
                <text x={cx * w} y={cy * h - fontSize * 0.55} textAnchor="middle" dominantBaseline="middle" style={{ fontSize }}>
                  {s.short_label || s.name}
                </text>
                <text className={styles.sectorCap} x={cx * w} y={cy * h + fontSize * 0.7} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: fontSize * 0.85 }}>
                  {Number(s.capacity || 0).toLocaleString("es-CL")}
                </text>
              </g>
            );
          })}
        </svg>
        <p className={styles.mapCaption}>
          Plano v{plan.version} · haz clic en un sector para venderlo o no ·{" "}
          <Link href={`/recintos/${plan.venueId}/plano/`} className={styles.mapLink}>
            editar el plano
          </Link>
        </p>
      </div>

      <div className={styles.sectorTable}>
        <div className={`${styles.sectorRow} ${styles.sectorRowHead}`} aria-hidden="true">
          <span></span>
          <span>Sector</span>
          <span>Capacidad</span>
          <span>Precio (CLP)</span>
        </div>
        {sectors.map((s) => {
          const issue = showErrors ? sectorIssue(s, false) : null;
          return (
            <div key={s.key} className={styles.sectorRowWrap}>
              <div className={styles.sectorRow} data-off={!s.is_active} data-invalid={!!issue}>
                <input type="checkbox" checked={s.is_active} onChange={() => toggle(s.key)} aria-label={`Vender ${s.name}`} />
                <div className={styles.sectorName}>
                  <span className={styles.sectorDot} style={{ background: s.color }} aria-hidden="true" />
                  <span className={`${styles.sectorNameText} ${styles.sectorNameWrap}`} title={s.name}>
                    {s.name}
                    <small className={styles.sectorKind}>{s.numbered ? "Numerado" : "General"}</small>
                  </span>
                </div>
                <span className={styles.sectorCapFixed}>{Number(s.capacity || 0).toLocaleString("es-CL")}</span>
                <div className={styles.sectorPricePrefix}>
                  <b aria-hidden="true">$</b>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    inputMode="numeric"
                    value={s.price}
                    placeholder="0"
                    aria-label={`Precio de ${s.name} en CLP`}
                    aria-invalid={issue === "Falta el precio"}
                    onChange={(e) => update(s.key, { price: toAmount(e.target.value) })}
                  />
                </div>
              </div>
              {issue && <p className={styles.sectorError}>{issue}</p>}
            </div>
          );
        })}
        <div className={styles.capTotal}>
          <div>
            Aforo habilitado
            <small className={styles.capTotalSub}>
              {active.length} de {sectors.length} sectores a la venta · capacidad del plano {totalCap.toLocaleString("es-CL")}
            </small>
          </div>
          <span>{activeCap.toLocaleString("es-CL")} pers.</span>
        </div>
        <p className={styles.planNote}>
          <MaterialIcon decorative name="info" />
          La capacidad y los asientos vienen del plano del recinto. Para cambiarlos, edita el plano y publica una nueva versión.
        </p>
      </div>
    </div>
  );
}
