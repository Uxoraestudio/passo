"use client";

import { useState, type ReactNode } from "react";
import { MaterialIcon } from "@/components/icons";
import type { Point, Section } from "@/lib/venue-map-types";
import { GENERATOR_LIMITS, rotationTowards, type GeneratorParams, type GeneratorResult } from "./seatGenerator";
import { centroid, type Size } from "./geometry";
import styles from "./VenueEditor.module.css";

type Props = {
  section: Section;
  params: GeneratorParams;
  prefix: string;
  result: GeneratorResult;
  /** Generated seats dropped because a hand-edited seat already uses that label or spot. */
  dropped: number;
  manualCount: number;
  size: Size;
  scaleMPerPx: number | null;
  stage: Point | null;
  onChange: (params: GeneratorParams) => void;
  onPrefix: (prefix: string) => void;
  onApply: () => void;
  onCancel: () => void;
};

function Num({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <div className={styles.inputSuffix}>
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? Math.round(value * 100) / 100 : ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (e.target.value !== "" && Number.isFinite(v)) onChange(v);
          }}
        />
        {suffix && <small>{suffix}</small>}
      </div>
    </label>
  );
}

/**
 * Free-text field that updates the preview on every keystroke (no blur needed,
 * so "Aplicar" right after typing uses the new value). Keeps the raw text locally.
 */
function LiveText({
  label,
  initial,
  placeholder,
  hint,
  maxLength,
  onValue,
}: {
  label: string;
  initial: string;
  placeholder?: string;
  hint?: ReactNode;
  maxLength?: number;
  onValue: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        value={text}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => {
          setText(e.target.value);
          onValue(e.target.value);
        }}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

const parseList = (text: string) =>
  text
    .split(/[,\s]+/)
    .map((t) => Number.parseInt(t, 10))
    .filter((n) => Number.isFinite(n) && n > 0);

export default function SeatGeneratorPanel(props: Props) {
  const { section, params, result, scaleMPerPx, stage, size, onChange } = props;
  const set = (patch: Partial<GeneratorParams>) => onChange({ ...params, ...patch });
  // Distances are edited in meters once the plan is calibrated, in pixels before.
  const unit = scaleMPerPx ? "m" : "px";
  const toUnit = (px: number) => (scaleMPerPx ? px * scaleMPerPx : px);
  const fromUnit = (v: number) => (scaleMPerPx ? v / scaleMPerPx : v);
  const total = result.seats.length - props.dropped + props.manualCount;
  const blocked = result.duplicates.length > 0 || total === 0 || total > GENERATOR_LIMITS.seats;

  return (
    <section className={styles.panelCard} aria-labelledby="generador-titulo">
      <h3 id="generador-titulo" className={styles.panelTitle}>
        <MaterialIcon decorative name="event_seat" />
        Generar asientos · {section.name}
      </h3>
      <p className={styles.muted}>La vista previa en naranjo muestra el resultado. Nada cambia hasta que pulses «Aplicar».</p>

      <fieldset className={styles.group}>
        <legend>Filas y asientos</legend>
        <div className={styles.fieldRow}>
          <Num label="Filas" value={params.rows} min={1} max={GENERATOR_LIMITS.rows} onChange={(v) => set({ rows: Math.round(v) })} />
          <Num label="Asientos por fila" value={params.seatsPerRow} min={1} max={GENERATOR_LIMITS.seatsPerRow} onChange={(v) => set({ seatsPerRow: Math.round(v) })} />
        </div>
        <LiveText
          label="Asientos distintos por fila (opcional)"
          initial={(params.seatsPerRowList ?? []).join(", ")}
          placeholder="Ej: 18, 20, 22, 24"
          hint="Uno por fila, desde la primera; las filas sin valor usan el número general."
          onValue={(text) => {
            const list = parseList(text);
            set({ seatsPerRowList: list.length ? list : null, rows: list.length ? Math.max(params.rows, list.length) : params.rows });
          }}
        />
        <div className={styles.fieldRow}>
          <Num label="Entre asientos" value={toUnit(params.seatSpacing)} step={scaleMPerPx ? 0.05 : 1} min={0} suffix={unit} onChange={(v) => set({ seatSpacing: fromUnit(v) })} />
          <Num label="Entre filas" value={toUnit(params.rowSpacing)} step={scaleMPerPx ? 0.05 : 1} min={0} suffix={unit} onChange={(v) => set({ rowSpacing: fromUnit(v) })} />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Forma y orientación</legend>
        <div className={styles.segmented} role="radiogroup" aria-label="Forma de las filas">
          <button type="button" role="radio" aria-checked={!params.curved} onClick={() => set({ curved: false })}>
            Rectas
          </button>
          <button type="button" role="radio" aria-checked={params.curved} onClick={() => set({ curved: true })}>
            En arco
          </button>
        </div>
        {params.curved && (
          <Num label="Radio del arco (primera fila)" value={toUnit(params.arcRadius)} step={scaleMPerPx ? 0.5 : 5} min={0} suffix={unit} onChange={(v) => set({ arcRadius: fromUnit(v) })} />
        )}
        <div className={styles.fieldRow}>
          <Num label="Rotación" value={params.rotation} step={1} suffix="°" onChange={(v) => set({ rotation: ((v % 360) + 360) % 360 })} />
          <label className={styles.field}>
            <span>Alineación</span>
            <select value={params.alignment} onChange={(e) => set({ alignment: e.target.value as GeneratorParams["alignment"] })}>
              <option value="center">Centrada</option>
              <option value="left">Izquierda</option>
              <option value="right">Derecha</option>
            </select>
          </label>
        </div>
        {stage && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => set({ rotation: rotationTowards(params.center ?? centroid(section.polygon), stage, size) })}
          >
            <MaterialIcon decorative name="explore" />
            Orientar hacia el escenario
          </button>
        )}
        <div className={styles.fieldRow}>
          <LiveText label="Pasillo después del asiento" initial={params.aisles.join(", ")} placeholder="Ej: 6, 14" onValue={(text) => set({ aisles: parseList(text) })} />
          <Num label="Ancho del pasillo" value={params.aisleWidth} step={0.5} min={0} suffix="asientos" onChange={(v) => set({ aisleWidth: Math.max(0, v) })} />
        </div>
        <label className={styles.checkField}>
          <input type="checkbox" checked={params.clip} onChange={(e) => set({ clip: e.target.checked })} />
          Recortar los asientos que quedan fuera del sector
        </label>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Numeración</legend>
        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span>Filas con</span>
            <select
              value={params.rowLabels}
              onChange={(e) => {
                const rowLabels = e.target.value as GeneratorParams["rowLabels"];
                set({ rowLabels, rowStart: rowLabels === "letters" ? "A" : "1" });
              }}
            >
              <option value="letters">Letras (A, B, C…)</option>
              <option value="numbers">Números (1, 2, 3…)</option>
            </select>
          </label>
          <LiveText
            key={params.rowLabels}
            label="Primera fila"
            initial={params.rowStart}
            maxLength={params.rowLabels === "letters" ? 2 : 3}
            onValue={(text) => {
              const v = text.trim().toUpperCase();
              if (params.rowLabels === "letters" ? /^[A-Z]{1,2}$/.test(v) : /^\d{1,3}$/.test(v)) set({ rowStart: v });
            }}
          />
        </div>
        <label className={styles.field}>
          <span>Orden de las filas</span>
          <select value={params.rowOrder} onChange={(e) => set({ rowOrder: e.target.value as GeneratorParams["rowOrder"] })}>
            <option value="front-to-back">Desde el escenario hacia atrás</option>
            <option value="back-to-front">Desde atrás hacia el escenario</option>
          </select>
        </label>
        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span>Asientos</span>
            <select value={params.numbering} onChange={(e) => set({ numbering: e.target.value as GeneratorParams["numbering"] })}>
              <option value="ltr">Izquierda → derecha</option>
              <option value="rtl">Derecha → izquierda</option>
              <option value="odd-even-center">Impares / pares desde el centro</option>
            </select>
          </label>
          <Num label="Primer número" value={params.seatStart} min={0} onChange={(v) => set({ seatStart: Math.max(0, Math.round(v)) })} />
        </div>
        <LiveText
          label="Prefijo del sector"
          initial={props.prefix}
          maxLength={8}
          placeholder="Ej: PB-"
          hint={`Izquierda y derecha se entienden mirando hacia el escenario. Ej. de etiqueta: ${result.seats[0]?.label ?? "—"}`}
          onValue={(text) => props.onPrefix(text.trim().replace(/[^A-Za-z0-9._-]/g, ""))}
        />
      </fieldset>

      <div className={styles.summary} data-error={blocked}>
        <b>{total.toLocaleString("es-CL")} asientos</b> en {result.rows.length} filas
        {result.clipped > 0 && <span> · {result.clipped.toLocaleString("es-CL")} recortados por la forma del sector</span>}
        {props.manualCount > 0 && <span> · se mantienen {props.manualCount} editados a mano</span>}
        {props.dropped > 0 && <span> · {props.dropped} omitidos porque chocan con asientos editados a mano</span>}
        {result.duplicates.length > 0 && (
          <span role="alert">
            {" "}
            · Etiquetas repetidas: {result.duplicates.slice(0, 5).join(", ")}
            {result.duplicates.length > 5 ? "…" : ""}. Cambia la numeración o el prefijo.
          </span>
        )}
        {total > GENERATOR_LIMITS.seats && <span role="alert"> · Supera el máximo de {GENERATOR_LIMITS.seats.toLocaleString("es-CL")} asientos.</span>}
      </div>

      <div className={styles.fieldRow}>
        <button type="button" className={styles.secondaryButton} onClick={props.onCancel}>
          Cancelar
        </button>
        <button type="button" className={styles.primaryButton} onClick={props.onApply} disabled={blocked}>
          Aplicar
        </button>
      </div>
    </section>
  );
}

