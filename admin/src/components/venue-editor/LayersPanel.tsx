"use client";

import { MaterialIcon } from "@/components/icons";
import type { LayerKey, Layers } from "./editorTypes";
import styles from "./VenueEditor.module.css";

const rows: { key: LayerKey; label: string; lockable: boolean }[] = [
  { key: "elements", label: "Elementos", lockable: true },
  { key: "seats", label: "Asientos", lockable: false },
  { key: "sections", label: "Sectores", lockable: true },
  { key: "grid", label: "Grilla", lockable: false },
  { key: "background", label: "Plano (fondo)", lockable: false },
];

export default function LayersPanel({
  layers,
  onChange,
  gridStep,
  onGridStep,
  snap,
  onSnap,
  gridLabel,
}: {
  layers: Layers;
  onChange: (layers: Layers) => void;
  gridStep: number;
  onGridStep: (step: number) => void;
  snap: boolean;
  onSnap: (snap: boolean) => void;
  gridLabel: string;
}) {
  const toggle = (key: LayerKey, field: "visible" | "locked") => onChange({ ...layers, [key]: { ...layers[key], [field]: !layers[key][field] } });

  return (
    <section className={styles.panelCard} aria-labelledby="capas-titulo">
      <h3 id="capas-titulo" className={styles.panelTitle}>
        Capas
      </h3>
      <ul className={styles.layerList}>
        {rows.map((r) => (
          <li key={r.key}>
            <span>{r.label}</span>
            <button
              type="button"
              className={styles.iconToggle}
              aria-pressed={layers[r.key].visible}
              aria-label={`${layers[r.key].visible ? "Ocultar" : "Mostrar"} ${r.label.toLowerCase()}`}
              onClick={() => toggle(r.key, "visible")}
            >
              <MaterialIcon decorative name={layers[r.key].visible ? "visibility" : "visibility_off"} />
            </button>
            {r.lockable ? (
              <button
                type="button"
                className={styles.iconToggle}
                aria-pressed={layers[r.key].locked}
                aria-label={`${layers[r.key].locked ? "Desbloquear" : "Bloquear"} ${r.label.toLowerCase()}`}
                onClick={() => toggle(r.key, "locked")}
              >
                <MaterialIcon decorative name={layers[r.key].locked ? "lock" : "lock_open"} />
              </button>
            ) : (
              <span className={styles.iconSpacer} />
            )}
          </li>
        ))}
      </ul>
      <label className={styles.inlineField}>
        <span>Opacidad del plano</span>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={layers.backgroundOpacity}
          onChange={(e) => onChange({ ...layers, backgroundOpacity: Number(e.target.value) })}
        />
      </label>
      <div className={styles.gridRow}>
        <label className={styles.inlineField}>
          <span>Grilla cada</span>
          <input type="number" min={2} max={1000} value={gridStep} onChange={(e) => onGridStep(Math.max(2, Math.min(1000, Number(e.target.value) || 2)))} />
          <small>{gridLabel}</small>
        </label>
        <label className={styles.checkField}>
          <input type="checkbox" checked={snap} onChange={(e) => onSnap(e.target.checked)} />
          Ajustar a la grilla
        </label>
      </div>
    </section>
  );
}
