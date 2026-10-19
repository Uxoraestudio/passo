"use client";

import { useCallback, useEffect, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { useCanEdit } from "@/lib/access";
import { createCoupon, deleteCoupon, listCoupons, normalizeCode, updateCoupon, type Coupon, type CouponKind, type CouponStats } from "@/lib/coupons-data";
import ConfirmDialog from "./ConfirmDialog";
import formStyles from "./EventFormPage.module.css";
import styles from "./EventCoupons.module.css";

const money = (v: number) => `$${v.toLocaleString("es-CL")}`;
const whole = (v: string) => v.replace(/\D/g, "").slice(0, 9);
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Santiago" }).format(new Date(iso));

const discountText = (c: Pick<Coupon, "kind" | "value">) => (c.kind === "percent" ? `${c.value}% de descuento` : `${money(c.value)} de descuento`);

function validity(c: Coupon, now: number) {
  if (!c.active) return { label: "Desactivado", tone: "off" };
  if (c.ends_at && new Date(c.ends_at).getTime() <= now) return { label: "Vencido", tone: "off" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: `Desde ${shortDate(c.starts_at)}`, tone: "next" };
  return { label: c.ends_at ? `Hasta ${shortDate(c.ends_at)}` : "Vigente", tone: "live" };
}

const emptyForm = { code: "", kind: "percent" as CouponKind, value: "", maxUses: "", start: "", end: "" };

/**
 * Discount coupons of one event. The buyer types the code in the last step of
 * the checkout; the discount comes off the tickets and the service fee is
 * charged on the discounted amount. Saved on their own, apart from «Guardar cambios».
 */
export default function EventCoupons({ eventId }: { eventId: string }) {
  const canEdit = useCanEdit("eventos");
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [stats, setStats] = useState<Record<string, CouponStats>>({});
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [toDelete, setToDelete] = useState<Coupon | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const data = await listCoupons(eventId);
      setCoupons(data.coupons);
      setStats(data.stats);
      setLoadError("");
      setNow(Date.now());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "No pudimos cargar los cupones.");
    }
  }, [eventId]);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const submit = async () => {
    setSuccess("");
    const code = normalizeCode(form.code);
    const value = Number(form.value);
    if (code.length < 3) return setFormError("El código debe tener al menos 3 caracteres (letras, números, - o _).");
    if (!(value > 0)) return setFormError("Indica el valor del descuento.");
    if (form.kind === "percent" && value > 100) return setFormError("El porcentaje no puede pasar de 100.");
    if (form.start && form.end && new Date(form.end) <= new Date(form.start)) return setFormError("El término debe ser posterior al inicio.");
    setFormError("");
    setSaving(true);
    try {
      await createCoupon(eventId, {
        code,
        kind: form.kind,
        value,
        max_uses: form.maxUses ? Number(form.maxUses) : null,
        starts_at: form.start ? new Date(form.start).toISOString() : null,
        ends_at: form.end ? new Date(form.end).toISOString() : null,
        active: true,
      });
      setForm(emptyForm);
      setSuccess(`Cupón ${code} creado. Ya se puede usar al comprar.`);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No pudimos crear el cupón.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Coupon) => {
    setSuccess("");
    setBusyId(c.id);
    try {
      await updateCoupon(c.id, { active: !c.active });
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No pudimos actualizar el cupón.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setSuccess("");
    setBusyId(toDelete.id);
    try {
      await deleteCoupon(toDelete.id);
      setToDelete(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No pudimos eliminar el cupón.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={formStyles.sec} id="s-cupones" aria-labelledby="h-cupones">
      <div className={formStyles.secHead}>
        <div className={formStyles.secIcon} data-tone="green" aria-hidden="true">
          <MaterialIcon decorative name="confirmation_number" />
        </div>
        <div>
          <h2 className={formStyles.secTitle} id="h-cupones" tabIndex={-1}>
            Cupones de descuento
          </h2>
          <p className={formStyles.secDesc}>
            El comprador escribe el código en el último paso de la compra. El descuento se aplica sobre las entradas y se guardan aparte de
            «Guardar cambios».
          </p>
        </div>
      </div>

      {canEdit && (
        <div className={styles.form}>
          <div className={`${formStyles.row} ${formStyles.c3}`}>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Código</span>
              <input
                value={form.code}
                maxLength={30}
                placeholder="Ej: VERANO20"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setForm({ ...form, code: normalizeCode(e.target.value) })}
              />
            </label>
            <label className={formStyles.field}>
              <span className={formStyles.label}>Tipo</span>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as CouponKind })}>
                <option value="percent">Porcentaje (%)</option>
                <option value="amount">Monto fijo ($)</option>
              </select>
            </label>
            <label className={formStyles.field}>
              <span className={formStyles.label}>{form.kind === "percent" ? "Descuento (%)" : "Descuento ($)"}</span>
              <input
                inputMode="numeric"
                value={form.value && form.kind === "amount" ? Number(form.value).toLocaleString("es-CL") : form.value}
                placeholder={form.kind === "percent" ? "Ej: 20" : "Ej: 5.000"}
                onChange={(e) => setForm({ ...form, value: whole(e.target.value) })}
              />
            </label>
          </div>
          <div className={`${formStyles.row} ${formStyles.c3}`}>
            <label className={formStyles.field}>
              <span className={formStyles.label}>
                Usos máximos <i>opcional</i>
              </span>
              <input inputMode="numeric" value={form.maxUses} placeholder="Sin límite" onChange={(e) => setForm({ ...form, maxUses: whole(e.target.value) })} />
            </label>
            <label className={formStyles.field}>
              <span className={formStyles.label}>
                Desde <i>opcional</i>
              </span>
              <input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </label>
            <label className={formStyles.field}>
              <span className={formStyles.label}>
                Hasta <i>opcional</i>
              </span>
              <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </label>
          </div>
          <p className={formStyles.hint}>Cada compra cuenta como un uso, sin importar cuántas entradas lleve. El total con descuento debe quedar sobre $1.000.</p>
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
            <button type="button" className={`${formStyles.btn} ${formStyles.btnOrange}`} onClick={submit} disabled={saving}>
              <MaterialIcon decorative name="add" />
              {saving ? "Creando…" : "Crear cupón"}
            </button>
          </div>
        </div>
      )}

      {loadError ? (
        <p className={formStyles.fieldError} role="alert">
          {loadError}
        </p>
      ) : coupons === null ? (
        <p className={styles.empty}>Cargando…</p>
      ) : coupons.length === 0 ? (
        <p className={styles.empty}>Este evento todavía no tiene cupones.</p>
      ) : (
        <ul className={styles.list}>
          {coupons.map((c) => {
            const s = stats[c.id];
            const state = validity(c, now);
            return (
              <li key={c.id} data-off={state.tone === "off"}>
                <div className={styles.codeCol}>
                  <code className={styles.code}>{c.code}</code>
                  <span className={styles.state} data-tone={state.tone}>
                    {state.label}
                  </span>
                </div>
                <div className={styles.info}>
                  <b>{discountText(c)}</b>
                  <span>
                    {(s?.paid_uses ?? 0).toLocaleString("es-CL")} {s?.paid_uses === 1 ? "uso" : "usos"}
                    {c.max_uses ? ` de ${c.max_uses.toLocaleString("es-CL")}` : ""}
                    {s?.pending_uses ? ` · ${s.pending_uses} en pago` : ""}
                    {s?.discount_total ? ` · ${money(s.discount_total)} descontados` : ""}
                  </span>
                </div>
                {canEdit && (
                  <div className={styles.actions}>
                    <button type="button" className={styles.ghost} onClick={() => toggle(c)} disabled={busyId === c.id}>
                      {c.active ? "Desactivar" : "Activar"}
                    </button>
                    <button type="button" className={styles.remove} onClick={() => setToDelete(c)} aria-label={`Eliminar cupón ${c.code}`} disabled={busyId === c.id}>
                      <MaterialIcon decorative name="delete" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        icon="delete"
        title={`¿Eliminar el cupón ${toDelete?.code ?? ""}?`}
        busy={busyId !== null && busyId === toDelete?.id}
        onClose={() => setToDelete(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setToDelete(null), autoFocus: true },
          { label: "Eliminar", variant: "danger", onClick: confirmDelete, busyLabel: "Eliminando…" },
        ]}
      >
        <p>Deja de funcionar de inmediato. Las compras que ya lo usaron conservan su descuento y su código.</p>
      </ConfirmDialog>
    </section>
  );
}
