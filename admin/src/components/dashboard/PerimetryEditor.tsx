"use client";

import type { KeyboardEvent } from "react";
import { MaterialIcon } from "@/components/icons";
import { PALETTE } from "@/lib/venue-layouts";
import type { Venue } from "@/lib/venues-data";
import styles from "./EventFormPage.module.css";

export type SectorDraft = {
  key: string;
  id?: string;
  name: string;
  short_label: string;
  capacity: number | "";
  price: number | "";
  color: string;
  shape_rect: [number, number, number, number] | null;
  shape_path: string | null;
  label_x: number | null;
  label_y: number | null;
  is_active: boolean;
  numbered: boolean;
};

function shapeCenter(s: SectorDraft): [number, number] {
  if (s.label_x != null && s.label_y != null) return [s.label_x, s.label_y];
  if (s.shape_rect) return [s.shape_rect[0] + s.shape_rect[2] / 2, s.shape_rect[1] + s.shape_rect[3] / 2];
  return [300, 210];
}

function toAmount(raw: string): number | "" {
  if (raw === "") return "";
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? Math.max(0, n) : "";
}

export function sectorIssue(s: SectorDraft, isCustom: boolean): string | null {
  if (!s.is_active) return null;
  if (isCustom && !s.name.trim()) return "Falta el nombre";
  if (!(Number(s.capacity) > 0)) return "Falta la capacidad";
  if (!(Number(s.price) > 0)) return "Falta el precio";
  return null;
}

export default function PerimetryEditor({
  venue,
  sectors,
  onChange,
  showErrors,
}: {
  venue: Venue | null;
  sectors: SectorDraft[];
  onChange: (sectors: SectorDraft[]) => void;
  showErrors: boolean;
}) {
  if (!venue) {
    return (
      <div className={styles.emptyPerimetry}>
        <MaterialIcon decorative name="grid_on" />
        <b>Selecciona un recinto</b>
        <span>para cargar su perimetría y sectores.</span>
      </div>
    );
  }

  const isCustom = venue.is_custom || venue.layout_key === "custom";

  const toggleSector = (key: string) => {
    onChange(sectors.map((s) => (s.key === key ? { ...s, is_active: !s.is_active } : s)));
  };

  const updateSector = (key: string, patch: Partial<SectorDraft>) => {
    onChange(sectors.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const removeSector = (key: string) => {
    onChange(sectors.filter((s) => s.key !== key));
  };

  const addSector = () => {
    onChange([
      ...sectors,
      {
        key: crypto.randomUUID(),
        name: "",
        short_label: "",
        capacity: "",
        price: "",
        color: PALETTE[sectors.length % PALETTE.length],
        shape_rect: null,
        shape_path: null,
        label_x: null,
        label_y: null,
        is_active: true,
        numbered: false,
      },
    ]);
  };

  const onSectorKey = (e: KeyboardEvent<SVGGElement>, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSector(key);
    }
  };

  const activeCap = sectors.filter((s) => s.is_active).reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
  const totalCap = sectors.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
  const activeCount = sectors.filter((s) => s.is_active).length;

  return (
    <div className={styles.mapWrap} data-custom={isCustom}>
      {!isCustom && (
        <div className={styles.map}>
          <svg viewBox="0 0 600 420" role="group" aria-label={`Plano de ${venue.name}`}>
            {venue.base_shapes.map((b, i) => (
              <g key={i} style={{ fill: b.type === "field" ? "#133a26" : "#2a2850" }} aria-hidden="true">
                <rect x={b.rect[0]} y={b.rect[1]} width={b.rect[2]} height={b.rect[3]} rx={8} />
                {b.label && (
                  <text x={b.rect[0] + b.rect[2] / 2} y={b.rect[1] + b.rect[3] / 2} textAnchor="middle" dominantBaseline="middle" style={{ letterSpacing: 2, fill: "#c9c7ef" }}>
                    {b.label}
                  </text>
                )}
              </g>
            ))}
            {sectors.map((s) => {
              const [cx, cy] = shapeCenter(s);
              return (
                <g
                  key={s.key}
                  className={styles.sector}
                  data-off={!s.is_active}
                  style={{ fill: s.color }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={s.is_active}
                  aria-label={`${s.name}: ${s.is_active ? "activo" : "inactivo"}`}
                  onClick={() => toggleSector(s.key)}
                  onKeyDown={(e) => onSectorKey(e, s.key)}
                >
                  {s.shape_path ? <path d={s.shape_path} /> : s.shape_rect ? <rect x={s.shape_rect[0]} y={s.shape_rect[1]} width={s.shape_rect[2]} height={s.shape_rect[3]} rx={8} /> : null}
                  <text x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="middle">
                    {s.short_label}
                  </text>
                  <text className={styles.sectorCap} x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="middle">
                    {Number(s.capacity || 0).toLocaleString("es-CL")}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className={styles.mapCaption}>Haz clic en un sector para activarlo o desactivarlo</p>
        </div>
      )}

      <div className={styles.sectorTable}>
        <div className={`${styles.sectorRow} ${styles.sectorRowHead}`} data-custom={isCustom} aria-hidden="true">
          <span></span>
          <span>Sector</span>
          <span>Capacidad</span>
          <span>Precio (CLP)</span>
          {isCustom && <span></span>}
        </div>

        {isCustom && sectors.length === 0 && (
          <p className={styles.sectorEmpty} data-error={showErrors}>
            Agrega al menos un sector con su capacidad y precio.
          </p>
        )}

        {sectors.map((s, i) => {
          const issue = showErrors ? sectorIssue(s, isCustom) : null;
          const label = s.name || `Sector ${i + 1}`;
          return (
            <div key={s.key} className={styles.sectorRowWrap}>
              <div className={styles.sectorRow} data-custom={isCustom} data-off={!s.is_active} data-invalid={!!issue}>
                <input type="checkbox" checked={s.is_active} onChange={() => toggleSector(s.key)} aria-label={`Vender ${label}`} />
                <div className={styles.sectorName}>
                  <span className={styles.sectorDot} style={{ background: s.color }} aria-hidden="true" />
                  {isCustom ? (
                    <input
                      type="text"
                      value={s.name}
                      maxLength={40}
                      placeholder="Nombre del sector"
                      aria-label={`Nombre del sector ${i + 1}`}
                      aria-invalid={issue === "Falta el nombre"}
                      onChange={(e) => updateSector(s.key, { name: e.target.value, short_label: e.target.value })}
                    />
                  ) : (
                    <span className={styles.sectorNameText} title={s.name}>
                      {s.name}
                    </span>
                  )}
                  <label className={styles.numberedToggle} title="El comprador elige fila y asiento">
                    <input
                      type="checkbox"
                      checked={s.numbered}
                      onChange={() => updateSector(s.key, { numbered: !s.numbered })}
                      aria-label={`${label}: asientos numerados`}
                    />
                    Numerado
                  </label>
                </div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={s.capacity}
                  placeholder="0"
                  aria-label={`Capacidad de ${label}`}
                  aria-invalid={issue === "Falta la capacidad"}
                  onChange={(e) => updateSector(s.key, { capacity: toAmount(e.target.value) })}
                />
                <div className={styles.sectorPricePrefix}>
                  <b aria-hidden="true">$</b>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    inputMode="numeric"
                    value={s.price}
                    placeholder="0"
                    aria-label={`Precio de ${label} en CLP`}
                    aria-invalid={issue === "Falta el precio"}
                    onChange={(e) => updateSector(s.key, { price: toAmount(e.target.value) })}
                  />
                </div>
                {isCustom && (
                  <button type="button" className={styles.deleteSectorButton} onClick={() => removeSector(s.key)} aria-label={`Eliminar ${label}`}>
                    <MaterialIcon decorative name="delete" />
                  </button>
                )}
              </div>
              {issue && <p className={styles.sectorError}>{issue}</p>}
            </div>
          );
        })}

        {isCustom && (
          <button type="button" className={styles.addSectorButton} onClick={addSector}>
            <MaterialIcon decorative name="add" />
            Agregar sector
          </button>
        )}

        <div className={styles.capTotal}>
          <div>
            Aforo habilitado
            <small className={styles.capTotalSub}>
              {activeCount} de {sectors.length} sectores activos · {totalCap.toLocaleString("es-CL")} capacidad máx.
            </small>
          </div>
          <span>{activeCap.toLocaleString("es-CL")} pers.</span>
        </div>
      </div>
    </div>
  );
}
