"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { useCanEdit } from "@/lib/access";
import { listSalePhases, salePhaseUsage, saveSalePhases, type PhaseUsage, type QuotaMode, type SalePhase } from "@/lib/sale-phases-data";
import ConfirmDialog from "./ConfirmDialog";
import formStyles from "./EventFormPage.module.css";
import styles from "./EventPresales.module.css";

type Sector = { id: string; name: string; price: number };

/** A phase while it is being edited: dates as datetime-local text, prices and quotas as typed. */
type Draft = {
  key: string;
  id: string | null;
  name: string;
  start: string;
  end: string;
  mode: QuotaMode;
  quota: string;
  prices: Record<string, string>;
  quotas: Record<string, string>;
};

const MAX_PHASES = 10;
const pad = (n: number) => String(n).padStart(2, "0");
const toLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fromLocal = (v: string) => (v ? new Date(v) : null);
const money = (v: number) => `$${v.toLocaleString("es-CL")}`;
const whole = (v: string) => v.replace(/\D/g, "").slice(0, 9);
const longDate = (d: Date) => new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);

let keySeq = 0;
const newKey = () => `ph-${++keySeq}`;

function toDraft(p: SalePhase): Draft {
  return {
    key: p.id ?? newKey(),
    id: p.id,
    name: p.name,
    start: toLocal(new Date(p.starts_at)),
    end: toLocal(new Date(p.ends_at)),
    mode: p.quota_mode,
    quota: p.quota ? String(p.quota) : "",
    prices: Object.fromEntries(Object.entries(p.prices).map(([k, v]) => [k, String(v.price)])),
    quotas: Object.fromEntries(Object.entries(p.prices).filter(([, v]) => v.quota).map(([k, v]) => [k, String(v.quota)])),
  };
}

const signature = (list: Draft[]) => JSON.stringify(list.map((d) => [d.id, d.name, d.start, d.end, d.mode, d.quota, d.prices, d.quotas]));

/** Problems of one phase, checked before saving (the server checks again). */
function issuesOf(d: Draft, i: number, list: Draft[], sectors: Sector[]): string[] {
  const out: string[] = [];
  const start = fromLocal(d.start);
  const end = fromLocal(d.end);
  if (!d.name.trim()) out.push("Ponle un nombre.");
  if (!start || !end) out.push("Completa el inicio y el término.");
  else if (end <= start) out.push("El término debe ser posterior al inicio.");
  const clash =
    start && end && end > start
      ? list.find((o, j) => {
          const os = fromLocal(o.start);
          const oe = fromLocal(o.end);
          return j !== i && os && oe && os < end && start < oe;
        })
      : undefined;
  if (clash) out.push(`Sus fechas se cruzan con «${clash.name || "otra preventa"}».`);
  if (d.mode === "general" && d.quota && Number(d.quota) < 1) out.push("El cupo debe ser 1 o más.");
  const priced = sectors.filter((s) => d.prices[s.id]);
  if (priced.length === 0) out.push("Indica el precio de preventa de al menos un sector.");
  if (priced.some((s) => Number(d.prices[s.id]) < 1)) out.push("Los precios deben ser mayores a 0.");
  if (d.mode === "sector") {
    const orphan = sectors.find((s) => d.quotas[s.id] && !d.prices[s.id]);
    if (orphan) out.push(`«${orphan.name}» tiene cupo pero no precio de preventa.`);
    if (sectors.some((s) => d.prices[s.id] && d.quotas[s.id] && Number(d.quotas[s.id]) < 1)) out.push("Los cupos deben ser 1 o más.");
  }
  return out;
}

function phaseState(d: Draft, usage: PhaseUsage[string] | undefined, now: number): { label: string; tone: "live" | "next" | "done" } | null {
  const start = fromLocal(d.start)?.getTime();
  const end = fromLocal(d.end)?.getTime();
  if (!d.id || start == null || end == null) return null;
  if (end <= now) return { label: "Terminada", tone: "done" };
  const exhausted =
    usage &&
    (d.mode === "general"
      ? !!d.quota && usage.taken >= Number(d.quota)
      : Object.keys(d.prices).every((id) => d.quotas[id] && (usage.sectors[id] ?? 0) >= Number(d.quotas[id])));
  if (exhausted) return { label: "Cupo agotado", tone: "done" };
  if (start <= now) return { label: "En curso", tone: "live" };
  return { label: "Programada", tone: "next" };
}

/**
 * Presales for an event: Preventa 1, Preventa 2… each with its own dates, an
 * optional ticket quota and a price per sector. They are saved on their own,
 * apart from «Guardar cambios».
 */
export default function EventPresales({ eventId, sectors, saleStart }: { eventId: string; sectors: Sector[]; saleStart: string | null }) {
  const canEdit = useCanEdit("eventos");
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [saved, setSaved] = useState("[]");
  const [usage, setUsage] = useState<PhaseUsage>({});
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showIssues, setShowIssues] = useState(false);
  const [toRemove, setToRemove] = useState<Draft | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const [phases, counts] = await Promise.all([listSalePhases(eventId), salePhaseUsage(eventId)]);
      const list = phases.map(toDraft);
      setDrafts(list);
      setSaved(signature(list));
      setUsage(counts);
      setLoadError("");
      setNow(Date.now());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "No pudimos cargar las preventas.");
    }
  }, [eventId]);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const list = useMemo(() => drafts ?? [], [drafts]);
  const dirty = drafts !== null && signature(list) !== saved;
  // The page's own leave guard only knows «Guardar cambios»; presales warn on their own.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const issues = useMemo(() => list.map((d, i) => issuesOf(d, i, list, sectors)), [list, sectors]);
  const hasIssues = issues.some((x) => x.length > 0);
  const saleStartDate = saleStart ? new Date(saleStart) : null;
  const lastEnd = list.length ? fromLocal(list[list.length - 1].end) : null;

  const patch = (key: string, change: Partial<Draft>) => {
    setDrafts((cur) => (cur ?? []).map((d) => (d.key === key ? { ...d, ...change } : d)));
    setSuccess("");
  };

  const add = () => {
    setDrafts((cur) => {
      const prev = cur ?? [];
      const last = prev[prev.length - 1];
      // Starts when the previous one ends (or now) and lasts a week, or until the general sale opens.
      const base = (last && fromLocal(last.end)) || new Date(Math.ceil(Date.now() / 3_600_000) * 3_600_000);
      const weekLater = new Date(base.getTime() + 7 * 86_400_000);
      const end = saleStartDate && saleStartDate > base && saleStartDate < weekLater ? saleStartDate : weekLater;
      return [
        ...prev,
        {
          key: newKey(),
          id: null,
          name: `Preventa ${prev.length + 1}`,
          start: toLocal(base),
          end: toLocal(end),
          mode: last?.mode ?? "general",
          quota: "",
          // Starts from the previous presale's prices, which are usually close.
          prices: last ? { ...last.prices } : {},
          quotas: {},
        },
      ];
    });
    setSuccess("");
  };

  const remove = (d: Draft) => {
    setDrafts((cur) => (cur ?? []).filter((x) => x.key !== d.key));
    setToRemove(null);
    setSuccess("");
  };

  const save = async () => {
    setShowIssues(true);
    setError("");
    setSuccess("");
    if (hasIssues) {
      setError("Revisa las preventas marcadas antes de guardar.");
      return;
    }
    setSaving(true);
    try {
      await saveSalePhases(
        eventId,
        // The server orders them by start date and checks overlaps again.
        [...list]
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((d) => ({
            id: d.id,
            name: d.name.trim(),
            starts_at: new Date(d.start).toISOString(),
            ends_at: new Date(d.end).toISOString(),
            quota_mode: d.mode,
            quota: d.mode === "general" && d.quota ? Number(d.quota) : null,
            prices: Object.fromEntries(
              sectors
                .filter((s) => d.prices[s.id])
                .map((s) => [s.id, { price: Number(d.prices[s.id]), quota: d.mode === "sector" && d.quotas[s.id] ? Number(d.quotas[s.id]) : null }])
            ),
          }))
      );
      await load();
      setShowIssues(false);
      setSuccess(list.length === 0 ? "Preventas eliminadas. El evento se vende a precio normal." : "Preventas guardadas. La web ya muestra los nuevos precios.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar las preventas.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={formStyles.sec} id="s-preventas" aria-labelledby="h-preventas">
      <div className={formStyles.secHead}>
        <div className={formStyles.secIcon} data-tone="orange" aria-hidden="true">
          <MaterialIcon decorative name="sell" />
        </div>
        <div>
          <h2 className={formStyles.secTitle} id="h-preventas" tabIndex={-1}>
            Preventas
          </h2>
          <p className={formStyles.secDesc}>
            Etapas con precio especial antes de la venta general. Cada una termina en su fecha o al agotar su cupo, lo que ocurra primero; después rige la
            siguiente o el precio normal. Se guardan aparte de «Guardar cambios».
          </p>
        </div>
      </div>

      {loadError ? (
        <p className={formStyles.fieldError} role="alert">
          {loadError}
        </p>
      ) : drafts === null ? (
        <p className={styles.empty}>Cargando…</p>
      ) : sectors.length === 0 ? (
        <p className={styles.empty}>Guarda el evento con al menos un sector activo para configurar preventas.</p>
      ) : (
        <>
          {saleStartDate && list.length > 0 && lastEnd && lastEnd < saleStartDate && (
            <p className={styles.note}>
              <MaterialIcon decorative name="info" />
              Entre el fin de la última preventa ({longDate(lastEnd)}) y el inicio de la venta general ({longDate(saleStartDate)}) no se podrá comprar.
            </p>
          )}

          {list.length === 0 ? (
            <p className={styles.empty}>Este evento no tiene preventas: se vende con los precios normales de cada sector.</p>
          ) : (
            <ol className={styles.phases}>
              {list.map((d, i) => {
                const use = d.id ? usage[d.id] : undefined;
                const state = phaseState(d, use, now);
                const problems = showIssues ? issues[i] : [];
                const bySector = d.mode === "sector";
                return (
                  <li key={d.key} className={styles.phase} data-invalid={problems.length > 0}>
                    <div className={styles.phaseHead}>
                      <span className={styles.phaseNum} aria-hidden="true">
                        {i + 1}
                      </span>
                      <label className={styles.nameField}>
                        <span className="sr-only">Nombre de la preventa {i + 1}</span>
                        <input value={d.name} maxLength={40} disabled={!canEdit} onChange={(e) => patch(d.key, { name: e.target.value })} placeholder={`Preventa ${i + 1}`} />
                      </label>
                      {state && (
                        <span className={styles.state} data-tone={state.tone}>
                          {state.label}
                        </span>
                      )}
                      {canEdit && (
                        <button type="button" className={styles.remove} onClick={() => setToRemove(d)} aria-label={`Quitar ${d.name || `preventa ${i + 1}`}`}>
                          <MaterialIcon decorative name="delete" />
                        </button>
                      )}
                    </div>

                    <div className={`${formStyles.row} ${formStyles.c2}`}>
                      <label className={formStyles.field}>
                        <span className={formStyles.label}>Inicio</span>
                        <input type="datetime-local" value={d.start} disabled={!canEdit} onChange={(e) => patch(d.key, { start: e.target.value })} />
                      </label>
                      <label className={formStyles.field}>
                        <span className={formStyles.label}>Término</span>
                        <input type="datetime-local" value={d.end} disabled={!canEdit} onChange={(e) => patch(d.key, { end: e.target.value })} />
                      </label>
                    </div>

                    <div className={styles.quotaRow}>
                      <div className={styles.modeSwitch} role="radiogroup" aria-label={`Cupo de ${d.name || "la preventa"}`}>
                        {(
                          [
                            ["general", "Cupo general"],
                            ["sector", "Cupo por sector"],
                          ] as const
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={d.mode === value}
                            data-active={d.mode === value}
                            disabled={!canEdit}
                            onClick={() => patch(d.key, { mode: value })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {bySector ? (
                        <p className={formStyles.hint}>Cada sector tiene su propio cupo. Al agotarse, ese sector vuelve a su precio normal y los demás siguen en preventa.</p>
                      ) : (
                        <label className={styles.generalQuota}>
                          <span className={formStyles.label}>
                            Entradas en preventa <i>opcional</i>
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Sin límite"
                            value={d.quota}
                            disabled={!canEdit}
                            onChange={(e) => patch(d.key, { quota: whole(e.target.value) })}
                          />
                          {use && (
                            <span className={formStyles.hint}>
                              {use.taken.toLocaleString("es-CL")} vendidas{d.quota ? ` de ${Number(d.quota).toLocaleString("es-CL")}` : ""}
                            </span>
                          )}
                        </label>
                      )}
                    </div>

                    <table className={styles.prices}>
                      <thead>
                        <tr>
                          <th scope="col">Sector</th>
                          <th scope="col">Precio normal</th>
                          <th scope="col">Precio preventa</th>
                          {bySector && <th scope="col">Cupo preventa</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {sectors.map((s) => {
                          const value = d.prices[s.id] ?? "";
                          const off = value && s.price > 0 ? Math.round((1 - Number(value) / s.price) * 100) : null;
                          return (
                            <tr key={s.id}>
                              <th scope="row">{s.name}</th>
                              <td>{money(s.price)}</td>
                              <td>
                                <div className={styles.priceInput}>
                                  <span aria-hidden="true">$</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Precio normal"
                                    aria-label={`Precio de ${d.name || "la preventa"} en ${s.name}`}
                                    value={value ? Number(value).toLocaleString("es-CL") : ""}
                                    disabled={!canEdit}
                                    onChange={(e) => patch(d.key, { prices: { ...d.prices, [s.id]: whole(e.target.value) } })}
                                  />
                                  {off !== null && off !== 0 && (
                                    <small className={styles.off} data-up={off < 0}>
                                      {off > 0 ? `−${off}%` : `+${-off}%`}
                                    </small>
                                  )}
                                </div>
                              </td>
                              {bySector && (
                                <td>
                                  <div className={styles.quotaCell}>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      placeholder="Sin límite"
                                      aria-label={`Cupo de ${d.name || "la preventa"} en ${s.name}`}
                                      value={d.quotas[s.id] ?? ""}
                                      disabled={!canEdit}
                                      onChange={(e) => patch(d.key, { quotas: { ...d.quotas, [s.id]: whole(e.target.value) } })}
                                    />
                                    {use && d.prices[s.id] && (
                                      <small>
                                        {(use.sectors[s.id] ?? 0).toLocaleString("es-CL")} vendidas
                                      </small>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className={formStyles.hint}>Un sector sin precio de preventa se vende a su precio normal. Los asientos con zona de precio mantienen el precio de su zona.</p>

                    {problems.length > 0 && (
                      <ul className={styles.problems} role="alert">
                        {problems.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {error && (
            <p className={formStyles.fieldError} role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className={styles.success} role="status">
              {success}
            </p>
          )}

          {canEdit && (
            <div className={styles.actions}>
              <button type="button" className={`${formStyles.btn} ${formStyles.btnSoft}`} onClick={add} disabled={list.length >= MAX_PHASES}>
                <MaterialIcon decorative name="add" />
                Agregar preventa
              </button>
              <button type="button" className={`${formStyles.btn} ${formStyles.btnOrange}`} onClick={save} disabled={saving || !dirty}>
                <MaterialIcon decorative name="save" />
                {saving ? "Guardando…" : "Guardar preventas"}
              </button>
              {dirty && !saving && <span className={styles.unsaved}>Cambios sin guardar</span>}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={toRemove !== null}
        icon="delete"
        title={`¿Quitar «${toRemove?.name || "esta preventa"}»?`}
        onClose={() => setToRemove(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setToRemove(null), autoFocus: true },
          { label: "Quitar", variant: "danger", onClick: () => toRemove && remove(toRemove) },
        ]}
      >
        <p>Se quitará al guardar las preventas. Las compras ya hechas en ella se mantienen.</p>
      </ConfirmDialog>
    </section>
  );
}
