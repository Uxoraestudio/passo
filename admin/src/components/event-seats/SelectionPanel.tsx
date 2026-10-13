"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { BLOCK_REASONS, type EventSeat, type EventSeatSector, type PriceZone, type SeatChanges } from "@/lib/event-seats-data";
import { countSeats, currency } from "./seatStats";
import editorStyles from "../venue-editor/VenueEditor.module.css";
import styles from "./EventSeats.module.css";

/** What the selected seats are and what can be done with them. */
export default function SelectionPanel({
  sectors,
  zones,
  selected,
  canEdit,
  busy,
  onSelectSector,
  onSelectRows,
  onClear,
  onApply,
}: {
  sectors: EventSeatSector[];
  zones: PriceZone[];
  selected: EventSeat[];
  canEdit: boolean;
  busy: boolean;
  onSelectSector: (sectorId: string) => void;
  onSelectRows: () => void;
  onClear: () => void;
  onApply: (changes: SeatChanges, label: string) => void;
}) {
  const seated = sectors.filter((s) => s.seats.length > 0);
  const [sectorId, setSectorId] = useState(seated[0]?.id ?? "");
  const [reason, setReason] = useState(BLOCK_REASONS[0].value);
  const counts = countSeats(selected);
  const n = selected.length;
  const seatsWord = (k: number) => `${k.toLocaleString("es-CL")} ${k === 1 ? "asiento" : "asientos"}`;

  // A zone button is "on" when every selected seat already has it.
  const allIn = (zoneId: string | null) => n > 0 && selected.every((s) => s.zoneId === zoneId);
  const allKind = (kind: EventSeat["kind"]) => n > 0 && selected.every((s) => s.kind === kind);
  const sectorPrices = [...new Set(selected.map((s) => sectors.find((x) => x.id === s.sectorId)?.price ?? 0))];

  return (
    <section className={editorStyles.panelCard} aria-labelledby="selection-title">
      <div className={styles.selectionHead}>
        <h2 className={editorStyles.panelTitle} id="selection-title">
          Selección
        </h2>
        {n > 0 && (
          <button type="button" className={styles.linkButton} onClick={onClear}>
            Quitar selección
          </button>
        )}
      </div>

      {n === 0 ? (
        <p className={editorStyles.muted}>
          Haz clic en un asiento o arrastra para marcar varios. <b>Mayús</b> suma a la selección y <b>Alt</b> quita. Mantén la barra espaciadora para mover el
          plano.
        </p>
      ) : (
        <>
          <p className={styles.bigCount} aria-live="polite">
            {seatsWord(n)}
          </p>
          <div className={styles.chips}>
            {counts.available > 0 && <span className={styles.chip}>{counts.available.toLocaleString("es-CL")} disponibles</span>}
            {counts.sold > 0 && <span className={styles.chip}>{counts.sold.toLocaleString("es-CL")} vendidos</span>}
            {counts.held > 0 && <span className={styles.chip}>{counts.held.toLocaleString("es-CL")} en pago</span>}
            {counts.blocked > 0 && <span className={styles.chip}>{counts.blocked.toLocaleString("es-CL")} bloqueados</span>}
            {counts.accessible > 0 && <span className={styles.chip}>{counts.accessible.toLocaleString("es-CL")} accesibles</span>}
          </div>
        </>
      )}

      <div className={styles.quickRow}>
        <label className={editorStyles.field}>
          <span>Seleccionar sector completo</span>
          <select value={sectorId} onChange={(e) => setSectorId(e.target.value)}>
            {seated.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.seats.length.toLocaleString("es-CL")})
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={editorStyles.secondaryButton} onClick={() => onSelectSector(sectorId)} disabled={!sectorId}>
          Seleccionar
        </button>
      </div>
      {n > 0 && (
        <button type="button" className={styles.linkButton} onClick={onSelectRows} style={{ alignSelf: "flex-start" }}>
          Extender a las filas completas
        </button>
      )}

      {canEdit && n > 0 && (
        <>
          <div className={styles.actionGroup} role="group" aria-labelledby="zone-actions">
            <h3 id="zone-actions">Zona de precio</h3>
            <div className={styles.zoneButtons}>
              <button
                type="button"
                className={styles.zoneButton}
                aria-pressed={allIn(null)}
                disabled={busy}
                onClick={() => onApply({ price_zone_id: null }, "Precio del sector")}
              >
                <span className={styles.dot} style={{ ["--dot-stroke" as string]: "#94a3b8" }} aria-hidden="true" />
                <span>Precio del sector</span>
                <small>{sectorPrices.length === 1 ? currency(sectorPrices[0]) : "según sector"}</small>
              </button>
              {zones.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  className={styles.zoneButton}
                  aria-pressed={allIn(z.id)}
                  disabled={busy}
                  onClick={() => onApply({ price_zone_id: z.id }, `Zona ${z.name}`)}
                >
                  <span className={styles.dot} style={{ ["--dot" as string]: z.color }} aria-hidden="true" />
                  <span title={z.name}>{z.name}</span>
                  <small>{currency(z.price)}</small>
                </button>
              ))}
            </div>
            {zones.length === 0 && <p className={editorStyles.muted}>Crea una zona más abajo para asignarla.</p>}
          </div>

          <div className={styles.actionGroup} role="group" aria-labelledby="block-actions">
            <h3 id="block-actions">Bloqueo</h3>
            <div className={styles.quickRow}>
              <label className={editorStyles.field}>
                <span>Motivo</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)}>
                  {BLOCK_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={editorStyles.secondaryButton}
                disabled={busy || counts.available === 0}
                onClick={() => onApply({ status: "BLOCKED", reason }, "Bloqueo")}
              >
                <MaterialIcon decorative name="block" />
                Bloquear
              </button>
            </div>
            <button
              type="button"
              className={editorStyles.secondaryButton}
              disabled={busy || counts.blocked === 0}
              onClick={() => onApply({ status: "AVAILABLE" }, "Desbloqueo")}
            >
              <MaterialIcon decorative name="lock_open" />
              Desbloquear {counts.blocked > 0 ? seatsWord(counts.blocked) : ""}
            </button>
            {counts.sold + counts.held > 0 && (
              <p className={editorStyles.muted}>Los asientos vendidos o en pago no se pueden bloquear; se omitirán.</p>
            )}
          </div>

          <div className={styles.actionGroup} role="group" aria-labelledby="kind-actions">
            <h3 id="kind-actions">Tipo de asiento</h3>
            <div className={editorStyles.segmented} role="radiogroup" aria-label="Tipo de asiento">
              {(
                [
                  ["NORMAL", "Normal"],
                  ["ACCESSIBLE", "Accesible"],
                  ["OBSTRUCTED", "Visión reducida"],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={allKind(kind)}
                  disabled={busy}
                  onClick={() => !allKind(kind) && onApply({ kind }, label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
