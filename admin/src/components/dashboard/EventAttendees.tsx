"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/icons";
import Select from "@/components/Select";
import { SkeletonHeader, SkeletonKpis, SkeletonTable } from "@/components/Skeleton";
import { getEvent, type EventRecord } from "@/lib/events-data";
import { attendeesCsv, getEventAttendees, KIND_LABEL, STATUS_LABEL, type Attendee, type AttendeeKind, type TicketStatus } from "@/lib/attendees-data";
import styles from "./EventAttendees.module.css";

const n = (v: number) => v.toLocaleString("es-CL");
const currency = (v: number | null) => (v == null ? "—" : `$${v.toLocaleString("es-CL")}`);
const fmt = (iso: string | null, opts: Intl.DateTimeFormatOptions) =>
  iso ? new Intl.DateTimeFormat("es-CL", { ...opts, timeZone: "America/Santiago" }).format(new Date(iso)) : "";
const shortDate = (iso: string | null) => fmt(iso, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const time = (iso: string | null) => fmt(iso, { hour: "2-digit", minute: "2-digit" });
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; event: EventRecord; rows: Attendee[] };

/** Everyone holding a ticket for the event: purchase detail, courtesies and door validation. */
export default function EventAttendees({ eventId }: { eventId: string }) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | AttendeeKind>("all");
  const [status, setStatus] = useState<"all" | TicketStatus>("all");
  const [sector, setSector] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getEvent(eventId), getEventAttendees(eventId)])
      .then(([event, rows]) => {
        if (!active) return;
        setLoad(event ? { state: "ready", event, rows } : { state: "error", message: "Este evento no existe o fue eliminado." });
      })
      .catch((e) => active && setLoad({ state: "error", message: e instanceof Error ? e.message : "No pudimos cargar la lista de asistentes." }));
    return () => {
      active = false;
    };
  }, [eventId, reloads]);

  const rows = useMemo(() => (load.state === "ready" ? load.rows : []), [load]);
  const sectors = useMemo(() => [...new Set(rows.map((r) => r.sector))].sort((a, b) => a.localeCompare(b, "es")), [rows]);
  const shown = useMemo(() => {
    const q = normalize(query.trim());
    return rows.filter(
      (r) =>
        (kind === "all" || r.kind === kind) &&
        (status === "all" || r.status === status) &&
        (sector === "all" || r.sector === sector) &&
        (!q || normalize([r.holder, r.document, r.email, r.order_code, r.buyer, r.buyer_email].filter(Boolean).join(" ")).includes(q))
    );
  }, [rows, query, kind, status, sector]);

  const totals = useMemo(() => {
    const active = rows.filter((r) => r.status !== "void");
    return {
      tickets: active.length,
      entered: active.filter((r) => r.status === "used").length,
      courtesies: active.filter((r) => r.kind !== "sale").length,
      voided: rows.length - active.length,
    };
  }, [rows]);

  const download = () => {
    if (load.state !== "ready") return;
    const blob = new Blob([attendeesCsv(shown)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asistentes-${load.event.slug || eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (load.state === "loading")
    return (
      <div className={styles.page}>
        <SkeletonHeader actions={2} />
        <SkeletonKpis label="Cargando resumen de asistentes…" />
        <SkeletonTable rows={8} columns={6} label="Cargando asistentes…" />
      </div>
    );
  if (load.state === "error")
    return (
      <div className={styles.state} role="alert">
        <p>{load.message}</p>
        <Link href="/eventos/" className={styles.secondary}>
          Volver a eventos
        </Link>
      </div>
    );

  const { event } = load;
  const filtered = shown.length !== rows.length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/eventos/" className={styles.back} aria-label="Volver a eventos">
          <MaterialIcon decorative name="arrow_back" />
        </Link>
        <div className={styles.titleBlock}>
          <h1>Lista de asistentes</h1>
          <p>
            {event.title} · {shortDate(event.event_date)} · {event.venue}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondary} onClick={() => setReloads((r) => r + 1)}>
            <MaterialIcon decorative name="refresh" />
            Actualizar
          </button>
          <button type="button" className={styles.primary} onClick={download} disabled={shown.length === 0}>
            <MaterialIcon decorative name="download" />
            Descargar {filtered ? "filtrados" : "lista"} (CSV)
          </button>
        </div>
      </header>

      <div className={styles.stats}>
        <div>
          <span>Entradas</span>
          <b>{n(totals.tickets)}</b>
        </div>
        <div>
          <span>Ingresaron</span>
          <b>
            {n(totals.entered)}
            <small>{totals.tickets > 0 ? ` · ${Math.round((totals.entered / totals.tickets) * 100)}%` : ""}</small>
          </b>
        </div>
        <div>
          <span>Por ingresar</span>
          <b>{n(totals.tickets - totals.entered)}</b>
        </div>
        <div>
          <span>Cortesías y prensa</span>
          <b>{n(totals.courtesies)}</b>
        </div>
        {totals.voided > 0 && (
          <div>
            <span>Anuladas</span>
            <b>{n(totals.voided)}</b>
          </div>
        )}
      </div>

      <div className={styles.filters}>
        <label className={styles.search}>
          <MaterialIcon decorative name="search" />
          <span className="sr-only">Buscar asistente</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre, RUT, correo o código de orden" />
        </label>
        <div className={styles.filterSelect}>
          <Select
            aria-label="Tipo de entrada"
            value={kind}
            onChange={(v) => setKind(v as typeof kind)}
            options={[
              { value: "all", label: "Todos los tipos" },
              { value: "sale", label: "Venta" },
              { value: "cortesia", label: "Cortesía" },
              { value: "prensa", label: "Prensa" },
            ]}
          />
        </div>
        <div className={styles.filterSelect}>
          <Select
            aria-label="Estado de validación"
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
            options={[
              { value: "all", label: "Todos los estados" },
              { value: "used", label: "Ingresó" },
              { value: "valid", label: "Por ingresar" },
              { value: "void", label: "Anulada" },
            ]}
          />
        </div>
        {sectors.length > 1 && (
          <div className={styles.filterSelect}>
            <Select
              aria-label="Sector"
              value={sector}
              onChange={setSector}
              options={[{ value: "all", label: "Todos los sectores" }, ...sectors.map((s) => ({ value: s, label: s }))]}
            />
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <MaterialIcon decorative name="groups" />
          <p>Este evento todavía no tiene entradas emitidas. Aquí aparecerán las compras y cortesías.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className={styles.empty}>
          <p>Ningún asistente coincide con la búsqueda o los filtros.</p>
        </div>
      ) : (
        <>
          <p className={styles.count} aria-live="polite">
            {filtered ? `${n(shown.length)} de ${n(rows.length)} entradas` : `${n(rows.length)} entradas`}
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Asistente</th>
                  <th scope="col">Ubicación</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Compra</th>
                  <th scope="col">Validación</th>
                  <th scope="col">
                    <span className="sr-only">Detalle</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((a) => {
                  const expanded = open === a.id;
                  return (
                    <Fragment key={a.id}>
                      <tr data-status={a.status} data-open={expanded}>
                        <td data-label="Asistente">
                          <b>{a.holder ?? "Sin nominar"}</b>
                          <small>{a.document ?? a.email ?? ""}</small>
                        </td>
                        <td data-label="Ubicación">
                          <b>{a.sector}</b>
                          <small>{a.seat}</small>
                        </td>
                        <td data-label="Tipo">
                          <span className={styles.kind} data-kind={a.kind}>
                            {KIND_LABEL[a.kind]}
                          </span>
                        </td>
                        <td data-label="Compra">
                          <b>{a.order_code}</b>
                          <small>
                            {shortDate(a.purchased_at)} · {a.kind === "sale" ? currency(a.price) : "Sin costo"}
                          </small>
                        </td>
                        <td data-label="Validación">
                          <span className={styles.status} data-status={a.status}>
                            {STATUS_LABEL[a.status]}
                          </span>
                          {a.status === "used" && (
                            <small>
                              {time(a.used_at)}
                              {a.used_gate ? ` · ${a.used_gate}` : ""}
                            </small>
                          )}
                        </td>
                        <td className={styles.toggleCell}>
                          <button
                            type="button"
                            className={styles.toggle}
                            aria-expanded={expanded}
                            aria-controls={`detalle-${a.id}`}
                            aria-label={`${expanded ? "Ocultar" : "Ver"} detalle de ${a.holder ?? "la entrada"}`}
                            onClick={() => setOpen(expanded ? null : a.id)}
                          >
                            <MaterialIcon decorative name={expanded ? "expand_less" : "expand_more"} />
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className={styles.detailRow} id={`detalle-${a.id}`}>
                          <td colSpan={6}>
                            <dl className={styles.detail}>
                              <div>
                                <dt>Comprador</dt>
                                <dd>{a.buyer}</dd>
                              </div>
                              <div>
                                <dt>Correo</dt>
                                <dd>{a.buyer_email}</dd>
                              </div>
                              {a.buyer_document && (
                                <div>
                                  <dt>Documento comprador</dt>
                                  <dd>{a.buyer_document}</dd>
                                </div>
                              )}
                              {a.buyer_phone && (
                                <div>
                                  <dt>Teléfono</dt>
                                  <dd>{a.buyer_phone}</dd>
                                </div>
                              )}
                              <div>
                                <dt>Total de la orden</dt>
                                <dd>{a.kind === "sale" ? currency(a.order_total) : "Sin costo"}</dd>
                              </div>
                              {a.issued_by && (
                                <div>
                                  <dt>Emitida por</dt>
                                  <dd>{a.issued_by}</dd>
                                </div>
                              )}
                              {a.note && (
                                <div>
                                  <dt>Nota</dt>
                                  <dd>{a.note}</dd>
                                </div>
                              )}
                              {a.status === "used" && (
                                <div>
                                  <dt>Validó</dt>
                                  <dd>
                                    {a.validated_by ?? "—"} · {shortDate(a.used_at)}
                                  </dd>
                                </div>
                              )}
                              {a.email && a.email !== a.buyer_email && (
                                <div>
                                  <dt>Correo del asistente</dt>
                                  <dd>{a.email}</dd>
                                </div>
                              )}
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
