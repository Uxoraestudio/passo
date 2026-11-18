"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/icons";
import { SkeletonCards } from "@/components/Skeleton";
import { managesProductoras, useAccess } from "@/lib/access";
import { countryByCode } from "@/lib/countries";
import {
  RequestsUnavailable,
  fetchProducerRequests,
  productoraFromRequest,
  updateProducerRequest,
  type ProducerRequest,
  type RequestStatus,
} from "@/lib/producer-requests-data";
import type { NewProductora } from "@/lib/productoras-data";
import NewProductoraDialog from "./NewProductoraDialog";
import pageStyles from "@/app/inicio/page.module.css";
import styles from "./SolicitudesContent.module.css";

const TABS: { status: RequestStatus; label: string; empty: string }[] = [
  { status: "nuevo", label: "Nuevas", empty: "No hay solicitudes nuevas. Llegan desde aforiq.cl/organizadores." },
  { status: "contactado", label: "Contactadas", empty: "Ninguna solicitud está marcada como contactada." },
  { status: "aprobado", label: "Aprobadas", empty: "Todavía no apruebas ninguna solicitud." },
  { status: "descartado", label: "Descartadas", empty: "No hay solicitudes descartadas." },
];

const STATUS_LABEL: Record<RequestStatus, string> = { nuevo: "Nueva", contactado: "Contactada", aprobado: "Aprobada", descartado: "Descartada" };

const dateText = (iso: string) =>
  new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Santiago" }).format(
    new Date(iso)
  );

const DAY = 86_400_000;
function ago(iso: string, now: number) {
  const days = Math.floor((now - new Date(iso).getTime()) / DAY);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

/**
 * Platform admins: producers who asked to sell with Aforiq from
 * /organizadores. «Aprobar» opens «Nueva productora» filled with the request:
 * it creates the productora and invites the requester to the panel.
 */
export default function SolicitudesContent() {
  const access = useAccess();
  const allowed = managesProductoras(access);
  const [list, setList] = useState<ProducerRequest[] | null>(null);
  const [state, setState] = useState<"ready" | "unavailable" | "error">("ready");
  const [reload, setReload] = useState(0);
  const [loadedAt, setLoadedAt] = useState(0);
  const [tab, setTab] = useState<RequestStatus>("nuevo");
  const [search, setSearch] = useState("");
  const [flash, setFlash] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cardError, setCardError] = useState<{ id: string; message: string } | null>(null);
  const [approving, setApproving] = useState<ProducerRequest | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    fetchProducerRequests()
      .then((rows) => {
        if (!active) return;
        setList(rows);
        setLoadedAt(Date.now());
        setState("ready");
      })
      .catch((e) => active && setState(e instanceof RequestsUnavailable ? "unavailable" : "error"));
    return () => {
      active = false;
    };
  }, [allowed, reload]);

  const counts = useMemo(() => {
    const c: Record<RequestStatus, number> = { nuevo: 0, contactado: 0, aprobado: 0, descartado: 0 };
    for (const r of list ?? []) c[r.status] += 1;
    return c;
  }, [list]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list ?? [])
      .filter((r) => r.status === tab)
      .filter((r) => !q || [r.company, r.first_name, r.last_name, r.email, r.event_name ?? "", r.city ?? ""].some((v) => v.toLowerCase().includes(q)));
  }, [list, tab, search]);

  const initial = useMemo<NewProductora | undefined>(() => (approving ? productoraFromRequest(approving) : undefined), [approving]);

  const move = async (r: ProducerRequest, status: RequestStatus, message: string) => {
    setBusyId(r.id);
    setCardError(null);
    setFlash("");
    try {
      await updateProducerRequest(r.id, { status });
      setList((rows) => rows?.map((x) => (x.id === r.id ? { ...x, status } : x)) ?? rows);
      setFlash(message);
    } catch (e) {
      setCardError({ id: r.id, message: e instanceof Error ? e.message : "No pudimos guardar el cambio." });
    } finally {
      setBusyId(null);
    }
  };

  const saveNotes = async (r: ProducerRequest, notes: string) => {
    setBusyId(r.id);
    setCardError(null);
    try {
      const value = notes.trim() || null;
      await updateProducerRequest(r.id, { admin_notes: value });
      setList((rows) => rows?.map((x) => (x.id === r.id ? { ...x, admin_notes: value } : x)) ?? rows);
    } catch (e) {
      setCardError({ id: r.id, message: e instanceof Error ? e.message : "No pudimos guardar las notas." });
    } finally {
      setBusyId(null);
    }
  };

  if (!allowed) {
    return (
      <main className={pageStyles.main}>
        <p className={styles.notice}>Solo un administrador de la plataforma puede ver las solicitudes de productoras.</p>
      </main>
    );
  }

  const current = TABS.find((t) => t.status === tab)!;

  return (
    <main className={pageStyles.main}>
      <div className={pageStyles.heroRow}>
        <div>
          <h1 className={pageStyles.pageTitle}>Solicitudes de productoras</h1>
          <p className={pageStyles.pageSubtitle}>
            Productores que pidieron vender con Aforiq desde aforiq.cl/organizadores. Al aprobar se crea la productora y su representante recibe la
            invitación al panel.
          </p>
        </div>
      </div>

      {flash && (
        <p className={styles.flash} role="status">
          <MaterialIcon decorative name="check_circle" />
          {flash}
        </p>
      )}

      {state === "unavailable" ? (
        <p className={styles.notice}>
          <MaterialIcon decorative name="info" />
          Las solicitudes se activan cuando se aplique la actualización de base de datos de solicitudes de productores.
        </p>
      ) : state === "error" ? (
        <div className={styles.notice} role="alert">
          <MaterialIcon decorative name="error" />
          <span>No pudimos cargar las solicitudes.</span>
          <button type="button" className={styles.ghost} onClick={() => setReload((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      ) : list === null ? (
        <SkeletonCards count={3} label="Cargando solicitudes…" />
      ) : (
        <>
          <div className={styles.toolbar}>
            <div className={styles.tabs} role="tablist" aria-label="Estado de las solicitudes">
              {TABS.map((t) => (
                <button
                  key={t.status}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.status}
                  className={styles.tab}
                  onClick={() => {
                    setTab(t.status);
                    setCardError(null);
                  }}
                >
                  {t.label}
                  <span className={styles.count} data-strong={t.status === "nuevo" && counts.nuevo > 0}>
                    {counts[t.status]}
                  </span>
                </button>
              ))}
            </div>
            <label className={styles.search}>
              <MaterialIcon decorative name="search" />
              <input
                type="search"
                value={search}
                placeholder="Buscar por productora, nombre o correo"
                aria-label="Buscar solicitudes"
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          {shown.length === 0 ? (
            <p className={styles.empty}>{search.trim() ? "Ninguna solicitud coincide con la búsqueda." : current.empty}</p>
          ) : (
            <ul className={styles.list} role="tabpanel" aria-label={current.label}>
              {shown.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  now={loadedAt}
                  busy={busyId === r.id}
                  error={cardError?.id === r.id ? cardError.message : ""}
                  onApprove={() => {
                    setFlash("");
                    setApproving(r);
                  }}
                  onMove={(status, message) => move(r, status, message)}
                  onSaveNotes={(notes) => saveNotes(r, notes)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <NewProductoraDialog
        open={approving !== null}
        initial={initial}
        requestId={approving?.id}
        title="Aprobar solicitud"
        submitLabel="Aprobar y enviar invitación"
        intro="Revisa los datos que envió desde /organizadores antes de aprobar: se crea la productora y su representante recibe la invitación al panel."
        onClose={() => setApproving(null)}
        onCreated={(data) => {
          setApproving(null);
          setTab("aprobado");
          setFlash(`Solicitud aprobada: creamos «${data.name.trim()}» y enviamos la invitación a ${data.email}.`);
          setReload((n) => n + 1);
        }}
      />
    </main>
  );
}

function RequestCard({
  request: r,
  now,
  busy,
  error,
  onApprove,
  onMove,
  onSaveNotes,
}: {
  request: ProducerRequest;
  now: number;
  busy: boolean;
  error: string;
  onApprove: () => void;
  onMove: (status: RequestStatus, message: string) => void;
  onSaveNotes: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(r.admin_notes ?? "");
  const dirty = notes.trim() !== (r.admin_notes ?? "").trim();
  const open = r.status === "nuevo" || r.status === "contactado";

  const details: [string, ReactNode][] = [
    ["Evento", r.event_name],
    ["Categoría", r.category],
    ["Fecha tentativa", r.tentative_date],
    ["Asistentes esperados", r.expected_attendees],
    ["Ubicación", [r.city, countryByCode(r.country)?.name].filter(Boolean).join(", ") || null],
    [
      "Sitio o redes",
      r.event_url ? (
        <a href={/^https?:\/\//i.test(r.event_url) ? r.event_url : `https://${r.event_url}`} target="_blank" rel="noopener noreferrer">
          {r.event_url}
        </a>
      ) : null,
    ],
  ];

  return (
    <li className={styles.card} data-status={r.status}>
      <header className={styles.cardHead}>
        <div className={styles.cardTitle}>
          <h2>{r.company}</h2>
          <span className={styles.status} data-status={r.status}>
            {STATUS_LABEL[r.status]}
          </span>
        </div>
        <time dateTime={r.created_at} title={dateText(r.created_at)} className={styles.when}>
          {now ? ago(r.created_at, now) : dateText(r.created_at)}
        </time>
      </header>

      <div className={styles.person}>
        <b>
          {r.first_name} {r.last_name}
        </b>
        <span>
          <a href={`mailto:${r.email}`}>{r.email}</a>
          {" · "}
          <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}>{r.phone}</a>
        </span>
      </div>

      <dl className={styles.details}>
        {details
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>

      {r.message && <blockquote className={styles.message}>{r.message}</blockquote>}

      <div className={styles.notes}>
        <label htmlFor={`notes-${r.id}`}>Notas internas</label>
        <textarea
          id={`notes-${r.id}`}
          rows={2}
          maxLength={2000}
          value={notes}
          placeholder="Ej: Hablamos por teléfono el martes, envía contrato."
          onChange={(e) => setNotes(e.target.value)}
        />
        {dirty && (
          <div className={styles.notesActions}>
            <button type="button" className={styles.ghost} onClick={() => setNotes(r.admin_notes ?? "")} disabled={busy}>
              Descartar cambios
            </button>
            <button type="button" className={styles.secondary} onClick={() => onSaveNotes(notes)} disabled={busy}>
              {busy ? "Guardando…" : "Guardar notas"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        {open && (
          <button type="button" className={styles.primary} onClick={onApprove} disabled={busy}>
            <MaterialIcon decorative name="how_to_reg" />
            Aprobar
          </button>
        )}
        {r.status === "nuevo" && (
          <button type="button" className={styles.secondary} onClick={() => onMove("contactado", `«${r.company}» quedó como contactada.`)} disabled={busy}>
            Marcar como contactada
          </button>
        )}
        {open && (
          <button type="button" className={styles.ghost} onClick={() => onMove("descartado", `«${r.company}» se movió a Descartadas.`)} disabled={busy}>
            Descartar
          </button>
        )}
        {r.status === "descartado" && (
          <button type="button" className={styles.secondary} onClick={() => onMove("nuevo", `«${r.company}» volvió a Nuevas.`)} disabled={busy}>
            Reabrir
          </button>
        )}
        {r.status === "aprobado" && (
          <Link href="/productoras/" className={styles.secondary}>
            <MaterialIcon decorative name="storefront" />
            Ver en Productoras
          </Link>
        )}
      </div>
    </li>
  );
}
