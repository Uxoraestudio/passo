"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import type { PriceZone } from "@/lib/event-seats-data";
import { currency } from "./seatStats";
import editorStyles from "../venue-editor/VenueEditor.module.css";
import styles from "./EventSeats.module.css";

const PALETTE = ["#6534f5", "#ff782d", "#0ea5e9", "#16a34a", "#e11d48", "#ca8a04", "#7c3aed", "#0f766e"];

type Draft = { id?: string; name: string; color: string; price: string };

/** Price zones of the event: create, rename, re-price, recolour or delete. */
export default function ZonesPanel({
  zones,
  seatsByZone,
  canEdit,
  onSave,
  onDelete,
}: {
  zones: PriceZone[];
  seatsByZone: Map<string, number>;
  canEdit: boolean;
  /** Resolves to an error message, or null when saved. */
  onSave: (zone: Omit<PriceZone, "id"> & { id?: string }) => Promise<string | null>;
  onDelete: (zone: PriceZone) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<PriceZone | null>(null);

  const open = (zone?: PriceZone) => {
    setError("");
    setDraft(
      zone
        ? { id: zone.id, name: zone.name, color: zone.color, price: String(zone.price) }
        : { name: "", color: PALETTE.find((c) => !zones.some((z) => z.color === c)) ?? PALETTE[zones.length % PALETTE.length], price: "" }
    );
  };

  const save = async () => {
    if (!draft || busy) return;
    const name = draft.name.trim();
    const price = Math.round(Number(draft.price));
    if (!name) return setError("Ponle un nombre a la zona, por ejemplo VIP o Preferencial.");
    if (name.length > 40) return setError("El nombre puede tener hasta 40 caracteres.");
    if (!Number.isFinite(price) || price < 1) return setError("El precio debe ser mayor a $0.");
    setBusy(true);
    const message = await onSave({ id: draft.id, name, color: draft.color, price });
    setBusy(false);
    if (message) setError(message);
    else setDraft(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    await onDelete(deleting);
    setBusy(false);
    setDeleting(null);
  };

  const deletingSeats = deleting ? (seatsByZone.get(deleting.id) ?? 0) : 0;

  return (
    <section className={editorStyles.panelCard} aria-labelledby="zones-title">
      <h2 className={editorStyles.panelTitle} id="zones-title">
        Zonas de precio <span className={editorStyles.count}>{zones.length}</span>
      </h2>
      {zones.length === 0 ? (
        <p className={editorStyles.muted}>
          Sin zonas, cada asiento cuesta el precio de su sector. Crea zonas (VIP, Preferencial…) para cobrar distinto dentro de un mismo sector.
        </p>
      ) : (
        <ul className={styles.zoneList}>
          {zones.map((z) => (
            <li key={z.id} className={styles.zoneItem}>
              <span className={styles.dot} style={{ ["--dot" as string]: z.color }} aria-hidden="true" />
              <span className={styles.zoneInfo}>
                <b title={z.name}>{z.name}</b>
                <small>{(seatsByZone.get(z.id) ?? 0).toLocaleString("es-CL")} asientos</small>
              </span>
              <span className={styles.zonePrice}>{currency(z.price)}</span>
              {canEdit && (
                <span className={styles.zoneActions}>
                  <button type="button" className={styles.smallIcon} onClick={() => open(z)} aria-label={`Editar zona ${z.name}`} title="Editar">
                    <MaterialIcon decorative name="edit" />
                  </button>
                  <button type="button" className={styles.smallIcon} onClick={() => setDeleting(z)} aria-label={`Eliminar zona ${z.name}`} title="Eliminar">
                    <MaterialIcon decorative name="delete" />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <button type="button" className={editorStyles.secondaryButton} onClick={() => open()}>
          <MaterialIcon decorative name="add" />
          Nueva zona
        </button>
      )}

      <ConfirmDialog
        open={draft !== null}
        kind="form"
        icon="sell"
        title={draft?.id ? "Editar zona de precio" : "Nueva zona de precio"}
        busy={busy}
        onClose={() => !busy && setDraft(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setDraft(null) },
          { label: draft?.id ? "Guardar zona" : "Crear zona", variant: "primary", onClick: save, busyLabel: "Guardando…" },
        ]}
      >
        <p>El precio de la zona reemplaza al del sector en los asientos que la tengan. Las compras ya hechas mantienen su precio.</p>
        {draft && (
          <div className={styles.zoneForm}>
            <label className={editorStyles.field}>
              <span>Nombre</span>
              <input
                data-autofocus
                value={draft.name}
                maxLength={40}
                placeholder="Ej. VIP"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && save()}
              />
            </label>
            <div className={editorStyles.fieldRow}>
              <label className={editorStyles.field}>
                <span>Precio (CLP)</span>
                <input
                  type="number"
                  min={1}
                  step={500}
                  inputMode="numeric"
                  value={draft.price}
                  placeholder="0"
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                />
              </label>
              <label className={editorStyles.field} style={{ maxWidth: 90 }}>
                <span>Color</span>
                <input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
              </label>
            </div>
            {error && (
              <p className={editorStyles.warn} role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting !== null}
        icon="delete"
        title={`¿Eliminar la zona ${deleting?.name ?? ""}?`}
        busy={busy}
        onClose={() => !busy && setDeleting(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setDeleting(null), autoFocus: true },
          { label: "Eliminar zona", variant: "danger", onClick: confirmDelete, busyLabel: "Eliminando…" },
        ]}
      >
        <p>
          {deletingSeats > 0
            ? `Sus ${deletingSeats.toLocaleString("es-CL")} asientos volverán a costar el precio de su sector.`
            : "Ningún asiento usa esta zona."}{" "}
          Las compras ya hechas no cambian.
        </p>
      </ConfirmDialog>
    </section>
  );
}
