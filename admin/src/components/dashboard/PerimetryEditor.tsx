"use client";

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
};

function shapeCenter(s: SectorDraft): [number, number] {
  if (s.label_x != null && s.label_y != null) return [s.label_x, s.label_y];
  if (s.shape_rect) return [s.shape_rect[0] + s.shape_rect[2] / 2, s.shape_rect[1] + s.shape_rect[3] / 2];
  return [300, 210];
}

export default function PerimetryEditor({
  venue,
  sectors,
  onChange,
}: {
  venue: Venue | null;
  sectors: SectorDraft[];
  onChange: (sectors: SectorDraft[]) => void;
}) {
  if (!venue) {
    return (
      <div className={styles.emptyPerimetry}>
        <MaterialIcon name="grid_on" />
        <b>Selecciona un recinto</b>
        <br />
        para cargar su perimetría y sectores.
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
      },
    ]);
  };

  const activeCap = sectors.filter((s) => s.is_active).reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
  const totalCap = sectors.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
  const activeCount = sectors.filter((s) => s.is_active).length;

  return (
    <div className={styles.mapWrap} style={isCustom ? { gridTemplateColumns: "1fr" } : undefined}>
      {!isCustom && (
        <div className={styles.map}>
          <svg viewBox="0 0 600 420">
            {venue.base_shapes.map((b, i) => (
              <g key={i} style={{ fill: b.type === "field" ? "#133a26" : "#2a2850" }}>
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
                  onClick={() => toggleSector(s.key)}
                >
                  <title>
                    {s.name} · {Number(s.capacity || 0).toLocaleString("es-CL")} pers.
                  </title>
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

      <div>
        <div className={`${styles.sectorRow} ${styles.sectorRowHead}`} data-custom={isCustom}>
          <span></span>
          <span>Sector</span>
          <span>Capacidad</span>
          <span>Precio (CLP)</span>
          {isCustom && <span></span>}
        </div>

        {sectors.map((s) => (
          <div key={s.key} className={styles.sectorRow} data-custom={isCustom} data-off={!s.is_active}>
            <input type="checkbox" checked={s.is_active} onChange={() => toggleSector(s.key)} />
            <div className={styles.sectorName}>
              <span className={styles.sectorDot} style={{ background: s.color }} />
              {isCustom ? (
                <input
                  type="text"
                  className={styles.sectorNameText}
                  value={s.name}
                  placeholder="Nombre del sector"
                  onChange={(e) => updateSector(s.key, { name: e.target.value, short_label: e.target.value })}
                />
              ) : (
                <span className={styles.sectorNameText}>{s.name}</span>
              )}
            </div>
            <input
              type="number"
              min={0}
              value={s.capacity}
              placeholder="0"
              onChange={(e) => updateSector(s.key, { capacity: e.target.value === "" ? "" : Number(e.target.value) })}
            />
            <div className={styles.sectorPricePrefix}>
              <b>$</b>
              <input
                type="number"
                min={0}
                value={s.price}
                placeholder="0"
                onChange={(e) => updateSector(s.key, { price: e.target.value === "" ? "" : Number(e.target.value) })}
              />
            </div>
            {isCustom && (
              <button type="button" className={styles.deleteSectorButton} onClick={() => removeSector(s.key)} aria-label="Eliminar sector">
                <MaterialIcon name="delete" />
              </button>
            )}
          </div>
        ))}

        {isCustom && (
          <button type="button" className={styles.addSectorButton} onClick={addSector}>
            <MaterialIcon name="add" />
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
