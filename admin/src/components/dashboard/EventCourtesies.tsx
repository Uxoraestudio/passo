"use client";

import { useCallback, useEffect, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useCanEdit } from "@/lib/access";
import { fetchCourtesies, formatDateTime, issueCourtesy, voidCourtesy, type Courtesy } from "@/lib/admin-data";
import ConfirmDialog from "./ConfirmDialog";
import formStyles from "./EventFormPage.module.css";
import styles from "./EventCourtesies.module.css";

type Sector = { id: string; name: string };

const kindLabel = { cortesia: "Cortesía", prensa: "Prensa" } as const;

export default function EventCourtesies({ eventId, sectors }: { eventId: string; sectors: Sector[] }) {
  const canEdit = useCanEdit("eventos");
  const [list, setList] = useState<Courtesy[] | null>(null);
  const [available, setAvailable] = useState<Record<string, number>>({});
  const [loadError, setLoadError] = useState("");

  const [kind, setKind] = useState<"cortesia" | "prensa">("cortesia");
  const [sectorId, setSectorId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [toVoid, setToVoid] = useState<Courtesy | null>(null);
  const [voiding, setVoiding] = useState(false);

  const selectedSector = sectors.some((s) => s.id === sectorId) ? sectorId : (sectors[0]?.id ?? "");

  const load = useCallback(async () => {
    try {
      const [rows, availability] = await Promise.all([
        fetchCourtesies(eventId),
        createClient().rpc("get_sector_availability", { p_event_id: eventId }),
      ]);
      setList(rows);
      setAvailable(
        Object.fromEntries(((availability.data ?? []) as { sector_id: string; capacity: number; taken: number }[]).map((a) => [a.sector_id, Math.max(0, a.capacity - a.taken)]))
      );
      setLoadError("");
    } catch {
      setLoadError("No pudimos cargar las cortesías de este evento.");
    }
  }, [eventId]);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const submit = async () => {
    if (!selectedSector) return;
    if (!name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setFormError("Ingresa el nombre y un correo válido del destinatario.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    setSuccess("");
    try {
      await issueCourtesy({ eventId, sectorId: selectedSector, quantity, kind, name, email, note });
      setSuccess(`${quantity} ${quantity === 1 ? "entrada emitida" : "entradas emitidas"} para ${name.trim()}. Las verá en Mi cuenta al ingresar con ${email.trim()}.`);
      setName("");
      setEmail("");
      setNote("");
      setQuantity(1);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No pudimos emitir las entradas.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmVoid = async () => {
    if (!toVoid) return;
    setVoiding(true);
    try {
      await voidCourtesy(toVoid.id);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No pudimos anular las entradas.");
    } finally {
      setVoiding(false);
      setToVoid(null);
    }
  };

  const active = (list ?? []).filter((c) => c.status === "paid");
  const issuedCount = active.reduce((sum, c) => sum + c.order_items.reduce((s, i) => s + i.quantity, 0), 0);

  return (
    <section className={formStyles.sec} id="s-cortesias" aria-labelledby="h-cortesias">
      <div className={formStyles.secHead}>
        <div className={formStyles.secIcon} data-tone="purple" aria-hidden="true">
          <MaterialIcon decorative name="confirmation_number" />
        </div>
        <div>
          <h2 className={formStyles.secTitle} id="h-cortesias" tabIndex={-1}>
            Cortesías y prensa
          </h2>
          <p className={formStyles.secDesc}>
            Entradas sin costo que descuentan aforo del sector. Se emiten al instante y no dependen de «Guardar cambios».
          </p>
        </div>
      </div>

      {sectors.length === 0 ? (
        <p className={styles.empty}>Guarda el evento con al menos un sector activo para poder emitir cortesías.</p>
      ) : canEdit ? (
        <div className={styles.form}>
          <div className={`${formStyles.row} ${formStyles.c3}`}>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="ct-kind">
                Tipo
              </label>
              <select id="ct-kind" value={kind} onChange={(e) => setKind(e.target.value as "cortesia" | "prensa")}>
                <option value="cortesia">Cortesía</option>
                <option value="prensa">Prensa / acreditación</option>
              </select>
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="ct-sector">
                Sector
              </label>
              <select id="ct-sector" value={selectedSector} onChange={(e) => setSectorId(e.target.value)}>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {available[s.id] !== undefined ? ` · ${available[s.id].toLocaleString("es-CL")} disponibles` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="ct-qty">
                Cantidad
              </label>
              <input
                id="ct-qty"
                type="number"
                min={1}
                max={50}
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(Math.min(50, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
              />
            </div>
          </div>
          <div className={`${formStyles.row} ${formStyles.c2}`}>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="ct-name">
                Nombre del destinatario
              </label>
              <input id="ct-name" value={name} maxLength={80} placeholder="Ej: Camila Rojas" onChange={(e) => setName(e.target.value)} />
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="ct-email">
                Correo
              </label>
              <input id="ct-email" type="email" value={email} placeholder="camila@medio.cl" onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className={formStyles.row}>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="ct-note">
                Nota interna (opcional)
              </label>
              <input id="ct-note" value={note} maxLength={140} placeholder="Ej: Acreditación revista Rockaxis" onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          {formError && (
            <p className={formStyles.fieldError} role="alert">
              {formError}
            </p>
          )}
          {success && (
            <p className={styles.success} role="status">
              {success}
            </p>
          )}
          <div>
            <button type="button" className={`${formStyles.btn} ${formStyles.btnOrange}`} onClick={submit} disabled={submitting}>
              <MaterialIcon decorative name="send" />
              {submitting ? "Emitiendo…" : `Emitir ${quantity === 1 ? "entrada" : `${quantity} entradas`}`}
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.listHead}>
        <h3>Emitidas</h3>
        <span>{issuedCount.toLocaleString("es-CL")} entradas vigentes</span>
      </div>
      {loadError ? (
        <p className={formStyles.fieldError} role="alert">
          {loadError}
        </p>
      ) : !list ? (
        <p className={styles.empty}>Cargando…</p>
      ) : list.length === 0 ? (
        <p className={styles.empty}>Aún no hay cortesías ni acreditaciones para este evento.</p>
      ) : (
        <ul className={styles.list}>
          {list.map((c) => {
            const qty = c.order_items.reduce((sum, i) => sum + i.quantity, 0);
            const seats = c.order_items.flatMap((i) => i.seat_labels);
            return (
              <li key={c.id} data-void={c.status !== "paid"}>
                <span className={styles.kind} data-kind={c.kind}>
                  {kindLabel[c.kind]}
                </span>
                <div className={styles.who}>
                  <b>{c.buyer_name}</b>
                  <span>
                    {c.buyer_email} · {qty}× {c.order_items[0]?.sector_name}
                    {seats.length > 0 && ` (${seats.join(", ")})`}
                  </span>
                  {c.note && <span>{c.note}</span>}
                </div>
                <span className={styles.when}>
                  {c.status === "paid" ? formatDateTime(c.created_at) : "Anulada"}
                  <small>{c.code}</small>
                </span>
                {canEdit && c.status === "paid" && (
                  <button type="button" className={styles.void} onClick={() => setToVoid(c)} aria-label={`Anular ${kindLabel[c.kind].toLowerCase()} de ${c.buyer_name}`}>
                    Anular
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={toVoid !== null}
        icon="block"
        title="¿Anular estas entradas?"
        busy={voiding}
        onClose={() => setToVoid(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setToVoid(null), autoFocus: true },
          { label: "Anular entradas", variant: "danger", onClick: confirmVoid, busyLabel: "Anulando…" },
        ]}
      >
        <p>
          Las entradas de <b>{toVoid?.buyer_name}</b> dejarán de ser válidas en puerta y sus lugares volverán a estar disponibles.
        </p>
      </ConfirmDialog>
    </section>
  );
}
