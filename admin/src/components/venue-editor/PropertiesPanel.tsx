"use client";

import { useRef, type ReactNode } from "react";
import { MaterialIcon } from "@/components/icons";
import { mapCapacity, sectionCapacity, type ElementKind, type MapElement, type Section, type VenueMapContent } from "@/lib/venue-map-types";
import { deleteItems, ELEMENT_COLORS, ELEMENT_LABELS, updateElement, updateSection, type SelectionItem } from "./contentOps";
import { MAP_IMAGE_TYPES } from "@/lib/venue-maps-data";
import styles from "./VenueEditor.module.css";

/** Text/number input that commits on blur or Enter, so one edit is one undo step. */
function CommitField({
  label,
  value,
  onCommit,
  type = "text",
  disabled,
  hint,
  maxLength,
  min,
}: {
  label: string;
  value: string;
  onCommit: (value: string) => void;
  type?: "text" | "number";
  disabled?: boolean;
  hint?: ReactNode;
  maxLength?: number;
  min?: number;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        key={value}
        type={type}
        defaultValue={value}
        disabled={disabled}
        maxLength={maxLength}
        min={min}
        onBlur={(e) => e.target.value !== value && onCommit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            (e.target as HTMLInputElement).value = value;
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function polygonAreaPx(section: Section, w: number, h: number) {
  let a = 0;
  const p = section.polygon;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    a += x1 * w * (y2 * h) - x2 * w * (y1 * h);
  }
  return Math.abs(a) / 2;
}

type Props = {
  content: VenueMapContent;
  selection: SelectionItem[];
  readOnly: boolean;
  uploading: boolean;
  onCommit: (content: VenueMapContent) => void;
  onSelect: (selection: SelectionItem[]) => void;
  onUploadImage: (file: File) => void;
};

export default function PropertiesPanel(props: Props) {
  const { content, selection, readOnly, onCommit, onSelect } = props;

  if (selection.length > 1) {
    return (
      <section className={styles.panelCard}>
        <h3 className={styles.panelTitle}>{selection.length} elementos seleccionados</h3>
        <p className={styles.muted}>Arrástralos para moverlos juntos, o usa las flechas del teclado (Mayús para pasos grandes).</p>
        {!readOnly && (
          <button type="button" className={styles.dangerButton} onClick={() => onCommit(deleteItems(content, selection))}>
            <MaterialIcon decorative name="delete" />
            Eliminar selección
          </button>
        )}
      </section>
    );
  }

  const only = selection[0];
  const section = only?.kind === "section" ? content.sections.find((s) => s.id === only.id) : undefined;
  if (section) return <SectionProps {...props} section={section} />;
  const element = only?.kind === "element" ? content.elements.find((e) => e.id === only.id) : undefined;
  if (element) return <ElementProps {...props} element={element} />;

  return <MapProps {...props} onPickSection={(id) => onSelect([{ kind: "section", id }])} />;
}

function MapProps({ content, readOnly, uploading, onCommit, onUploadImage, onPickSection }: Props & { onPickSection: (id: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const scale = content.scaleMPerPx;
  return (
    <>
      <section className={styles.panelCard} aria-labelledby="plano-titulo">
        <h3 id="plano-titulo" className={styles.panelTitle}>
          Plano
        </h3>
        <p className={styles.muted}>
          {content.imagePath ? `Imagen de ${content.imageWidth.toLocaleString("es-CL")} × ${content.imageHeight.toLocaleString("es-CL")} px.` : "Aún no hay imagen del plano."}
        </p>
        {!readOnly && (
          <>
            <button type="button" className={styles.secondaryButton} onClick={() => fileRef.current?.click()} disabled={uploading}>
              <MaterialIcon decorative name="upload" />
              {uploading ? "Subiendo…" : content.imagePath ? "Reemplazar imagen" : "Subir imagen del plano"}
            </button>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept={MAP_IMAGE_TYPES.join(",")}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onUploadImage(file);
              }}
            />
            <small className={styles.muted}>PNG, JPG o WebP · máx. 10 MB. Usa la mejor resolución que tengas.</small>
          </>
        )}
        <div className={styles.scaleBox} data-ok={Boolean(scale)}>
          <MaterialIcon decorative name="straighten" />
          {scale ? (
            <span>
              1 px = {scale.toLocaleString("es-CL", { maximumSignificantDigits: 3 })} m · el plano mide ≈ {(content.imageWidth * scale).toLocaleString("es-CL", { maximumFractionDigits: 0 })} ×{" "}
              {(content.imageHeight * scale).toLocaleString("es-CL", { maximumFractionDigits: 0 })} m
            </span>
          ) : (
            <span>Sin calibrar. Usa «Calibrar escala» (C): marca dos puntos e ingresa la distancia real.</span>
          )}
        </div>
      </section>

      <section className={styles.panelCard} aria-labelledby="sectores-titulo">
        <h3 id="sectores-titulo" className={styles.panelTitle}>
          Sectores <span className={styles.count}>{content.sections.length}</span>
        </h3>
        {content.sections.length === 0 ? (
          <p className={styles.muted}>Dibuja el primer sector con la herramienta «Dibujar sector» (P): haz clic en cada esquina y cierra en el primer punto.</p>
        ) : (
          <ul className={styles.sectionList}>
            {content.sections.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => onPickSection(s.id)}>
                  <span className={styles.swatch} style={{ background: s.color }} aria-hidden="true" />
                  <span className={styles.sectionName}>{s.name}</span>
                  <span className={styles.sectionMeta}>
                    {sectionCapacity(s).toLocaleString("es-CL")} {s.kind === "GENERAL_ADMISSION" ? "pers." : "asientos"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className={styles.total}>
          Capacidad total <b>{mapCapacity(content).toLocaleString("es-CL")}</b>
        </p>
      </section>

      <section className={styles.panelCard}>
        <label className={styles.field}>
          <span>Notas internas</span>
          <textarea
            key={content.notes ?? ""}
            defaultValue={content.notes ?? ""}
            rows={3}
            maxLength={500}
            disabled={readOnly}
            placeholder="Ej: plano oficial 2026, accesos por Av. Matta"
            onBlur={(e) => e.target.value !== (content.notes ?? "") && onCommit({ ...content, notes: e.target.value || null })}
          />
        </label>
      </section>
    </>
  );
}

function SectionProps({ content, readOnly, onCommit, section }: Props & { section: Section }) {
  const set = (patch: Partial<Section>) => onCommit(updateSection(content, section.id, patch));
  const area = content.scaleMPerPx ? polygonAreaPx(section, content.imageWidth, content.imageHeight) * content.scaleMPerPx ** 2 : null;
  return (
    <section className={styles.panelCard} aria-labelledby="sector-titulo">
      <h3 id="sector-titulo" className={styles.panelTitle}>
        <span className={styles.swatch} style={{ background: section.color }} aria-hidden="true" />
        Sector
      </h3>
      <CommitField
        label="Nombre"
        value={section.name}
        maxLength={60}
        disabled={readOnly}
        onCommit={(v) => v.trim() && set({ name: v.trim() })}
      />
      <div className={styles.fieldRow}>
        <CommitField label="Abreviatura" value={section.shortLabel ?? ""} maxLength={12} disabled={readOnly} onCommit={(v) => set({ shortLabel: v.trim() || null })} />
        <label className={styles.field}>
          <span>Color</span>
          <input type="color" value={section.color} disabled={readOnly} onChange={(e) => set({ color: e.target.value })} />
        </label>
      </div>
      <label className={styles.field}>
        <span>Tipo</span>
        <select
          value={section.kind}
          disabled={readOnly}
          onChange={(e) => {
            const kind = e.target.value as Section["kind"];
            if (kind === "GENERAL_ADMISSION" && section.seats.length > 0 && !window.confirm(`Este sector tiene ${section.seats.length} asientos. Al pasarlo a entrada general se eliminarán. ¿Continuar?`)) return;
            set(kind === "GENERAL_ADMISSION" ? { kind, seats: [], rows: [], capacity: section.capacity ?? 100 } : { kind });
          }}
        >
          <option value="SEATED">Con asientos numerados</option>
          <option value="GENERAL_ADMISSION">Entrada general (sin asientos)</option>
        </select>
      </label>
      {section.kind === "GENERAL_ADMISSION" ? (
        <CommitField
          label="Capacidad"
          type="number"
          min={1}
          value={String(section.capacity ?? "")}
          disabled={readOnly}
          onCommit={(v) => Number(v) > 0 && set({ capacity: Math.floor(Number(v)) })}
          hint="Personas que caben en el sector."
        />
      ) : (
        <>
          <CommitField
            label="Prefijo de asientos"
            value={section.seatPrefix}
            maxLength={8}
            disabled={readOnly}
            onCommit={(v) => set({ seatPrefix: v.trim() })}
            hint={`Ej: «PB-» numera PB-A1, PB-A2… Los asientos se generan en la Fase 3.`}
          />
          <p className={styles.muted}>
            {section.seats.length.toLocaleString("es-CL")} asientos en {section.rows.length} filas.
          </p>
        </>
      )}
      <p className={styles.muted}>
        {section.polygon.length} puntos{area ? ` · ${area.toLocaleString("es-CL", { maximumFractionDigits: 0 })} m²` : ""}
      </p>
      {!readOnly && (
        <>
          <p className={styles.hint}>Arrastra los puntos naranjos para ajustar la forma. Doble clic en un borde agrega un punto; Alt + clic en un punto lo elimina.</p>
          <button type="button" className={styles.dangerButton} onClick={() => onCommit(deleteItems(content, [{ kind: "section", id: section.id }]))}>
            <MaterialIcon decorative name="delete" />
            Eliminar sector
          </button>
        </>
      )}
    </section>
  );
}

function ElementProps({ content, readOnly, onCommit, element }: Props & { element: MapElement }) {
  const set = (patch: Partial<MapElement>) => onCommit(updateElement(content, element.id, patch));
  const g = element.geometry;
  return (
    <section className={styles.panelCard} aria-labelledby="elemento-titulo">
      <h3 id="elemento-titulo" className={styles.panelTitle}>
        {ELEMENT_LABELS[element.kind]}
      </h3>
      <label className={styles.field}>
        <span>Tipo</span>
        <select value={element.kind} disabled={readOnly} onChange={(e) => set({ kind: e.target.value as ElementKind })}>
          {(Object.keys(ELEMENT_LABELS) as ElementKind[]).map((k) => (
            <option key={k} value={k}>
              {ELEMENT_LABELS[k]}
            </option>
          ))}
        </select>
      </label>
      <CommitField label="Texto visible" value={element.label ?? ""} maxLength={40} disabled={readOnly} onCommit={(v) => set({ label: v.trim() || null })} />
      <label className={styles.field}>
        <span>Color</span>
        <input type="color" value={element.color ?? ELEMENT_COLORS[element.kind]} disabled={readOnly} onChange={(e) => set({ color: e.target.value })} />
      </label>
      {(g.shape === "rect" || g.shape === "ellipse") && (
        <>
          <label className={styles.field}>
            <span>Forma</span>
            <select value={g.shape} disabled={readOnly} onChange={(e) => set({ geometry: { ...g, shape: e.target.value as "rect" | "ellipse" } })}>
              <option value="rect">Rectángulo</option>
              <option value="ellipse">Elipse</option>
            </select>
          </label>
          <CommitField
            label="Rotación (grados)"
            type="number"
            value={String(element.rotation)}
            disabled={readOnly}
            onCommit={(v) => Number.isFinite(Number(v)) && set({ rotation: ((Number(v) % 360) + 360) % 360 })}
          />
          {content.scaleMPerPx && (
            <p className={styles.muted}>
              {(g.w * content.imageWidth * content.scaleMPerPx).toLocaleString("es-CL", { maximumFractionDigits: 1 })} ×{" "}
              {(g.h * content.imageHeight * content.scaleMPerPx).toLocaleString("es-CL", { maximumFractionDigits: 1 })} m
            </p>
          )}
        </>
      )}
      {!readOnly && (
        <button type="button" className={styles.dangerButton} onClick={() => onCommit(deleteItems(content, [{ kind: "element", id: element.id }]))}>
          <MaterialIcon decorative name="delete" />
          Eliminar
        </button>
      )}
    </section>
  );
}
