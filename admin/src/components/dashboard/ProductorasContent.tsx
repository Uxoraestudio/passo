"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { countryByCode, formatPhone } from "@/lib/countries";
import { SkeletonCards } from "@/components/Skeleton";
import { managesProductoras, useAccess } from "@/lib/access";
import { ProductorasUnavailable, deleteProductora, fetchProductoras, inviteProductoraOwner, type Productora, type ProductoraMember } from "@/lib/productoras-data";
import ConfirmDialog from "./ConfirmDialog";
import NewProductoraDialog from "./NewProductoraDialog";
import pageStyles from "@/app/inicio/page.module.css";
import formStyles from "./RolesContent.module.css";
import styles from "./ProductorasContent.module.css";

/**
 * Platform admins: every productora on Aforiq, how many events each has and
 * who runs it. Each productora only sees its own events in the panel.
 */
export default function ProductorasContent() {
  const access = useAccess();
  const allowed = managesProductoras(access);
  const [list, setList] = useState<Productora[] | null>(null);
  const [state, setState] = useState<"ready" | "unavailable" | "error">("ready");
  const [reload, setReload] = useState(0);
  const [flash, setFlash] = useState("");

  // New productora
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  // Owner of an existing one
  const [ownerFor, setOwnerFor] = useState<Productora | null>(null);
  const [email, setEmail] = useState("");

  // Resend a pending invitation
  const [resending, setResending] = useState<string | null>(null);
  const [cardError, setCardError] = useState<{ org: string; message: string } | null>(null);

  // Delete (only without events; the name is typed to confirm)
  const [toDelete, setToDelete] = useState<Productora | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    fetchProductoras()
      .then((rows) => {
        if (!active) return;
        setList(rows);
        setState("ready");
      })
      .catch((e) => active && setState(e instanceof ProductorasUnavailable ? "unavailable" : "error"));
    return () => {
      active = false;
    };
  }, [allowed, reload]);

  const refresh = (message: string) => {
    setFlash(message);
    setReload((n) => n + 1);
  };

  const openCreate = () => {
    setFlash("");
    setCreating(true);
  };

  const openOwner = (p: Productora) => {
    setEmail("");
    setFormError("");
    setCardError(null);
    setOwnerFor(p);
  };

  const assignOwner = async () => {
    if (!ownerFor || !email.trim()) {
      setFormError("Escribe el correo del dueño.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const status = await inviteProductoraOwner(ownerFor.id, email);
      setOwnerFor(null);
      refresh(
        status === "resent"
          ? `Volvimos a enviar la invitación a ${email.trim()}.`
          : `Enviamos la invitación a ${email.trim()}. Cuando cree su contraseña podrá administrar «${ownerFor.name}».`
      );
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No pudimos enviar la invitación.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async (p: Productora, m: ProductoraMember) => {
    setResending(m.email);
    setCardError(null);
    setFlash("");
    try {
      await inviteProductoraOwner(p.id, m.email);
      setFlash(`Volvimos a enviar la invitación a ${m.email}.`);
    } catch (e) {
      setCardError({ org: p.id, message: e instanceof Error ? e.message : "No pudimos reenviar la invitación." });
    } finally {
      setResending(null);
    }
  };

  const openDelete = (p: Productora) => {
    setConfirmName("");
    setDeleteError("");
    setCardError(null);
    setFlash("");
    setToDelete(p);
  };

  const closeDelete = () => {
    if (!deleting) setToDelete(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    if (confirmName.trim() !== toDelete.name) {
      setDeleteError("El nombre no coincide. Escríbelo tal como aparece.");
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      const result = await deleteProductora(toDelete.id, confirmName.trim());
      const accounts = result.accounts_deleted;
      setToDelete(null);
      refresh(
        `Productora «${toDelete.name}» eliminada` +
          (accounts ? ` junto con ${accounts === 1 ? "la cuenta de su equipo" : `las ${accounts} cuentas de su equipo`}.` : ".")
      );
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "No pudimos eliminar la productora.");
    } finally {
      setDeleting(false);
    }
  };

  if (!allowed) {
    return (
      <main className={pageStyles.main}>
        <p className={styles.notice}>Solo un administrador de la plataforma puede ver las productoras.</p>
      </main>
    );
  }

  return (
    <main className={pageStyles.main}>
      <div className={pageStyles.heroRow}>
        <div>
          <h1 className={pageStyles.pageTitle}>Productoras</h1>
          <p className={pageStyles.pageSubtitle}>Cada productora ve y administra solo sus eventos, ventas, clientes y equipo.</p>
        </div>
        {state === "ready" && (
          <button type="button" className={styles.primary} onClick={openCreate}>
            <MaterialIcon decorative name="add" />
            Nueva productora
          </button>
        )}
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
          Las productoras se activan cuando se aplique la actualización de base de datos de productoras.
        </p>
      ) : state === "error" ? (
        <div className={styles.notice} role="alert">
          <MaterialIcon decorative name="error" />
          <span>No pudimos cargar las productoras.</span>
          <button type="button" className={styles.secondary} onClick={() => setReload((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      ) : list === null ? (
        <SkeletonCards count={3} label="Cargando productoras…" />
      ) : (
        <div className={styles.grid}>
          {list.map((p) => {
            const owners = p.team.filter((m) => m.role === "Productor");
            return (
              <article key={p.id} className={styles.card}>
                <header className={styles.cardHead}>
                  <span className={styles.logo} aria-hidden="true">
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className={styles.cardTitle}>
                    <h2>{p.name}</h2>
                    {p.is_default && <span className={styles.tag}>Principal</span>}
                    {p.country && <span className={styles.country}>{countryByCode(p.country)?.name ?? p.country}</span>}
                  </div>
                </header>

                <dl className={styles.stats}>
                  <div>
                    <dt>Eventos</dt>
                    <dd>{p.events.toLocaleString("es-CL")}</dd>
                  </div>
                  <div>
                    <dt>En venta</dt>
                    <dd>{p.events_on_sale.toLocaleString("es-CL")}</dd>
                  </div>
                  <div>
                    <dt>Equipo</dt>
                    <dd>{p.team.length.toLocaleString("es-CL")}</dd>
                  </div>
                </dl>

                {p.contact && (
                  <div className={styles.owners}>
                    <span className={styles.label}>Representante</span>
                    <p className={styles.contact}>
                      <b>{[p.contact.first_name, p.contact.last_name].filter(Boolean).join(" ")}</b>
                      <small>
                        {p.contact.email}
                        {p.contact.phone && (
                          <>
                            {" · "}
                            <a href={`tel:${p.contact.phone}`}>{formatPhone(p.contact.phone, p.country)}</a>
                          </>
                        )}
                      </small>
                    </p>
                  </div>
                )}

                <div className={styles.owners}>
                  <span className={styles.label}>Dueño en el panel</span>
                  {owners.length === 0 ? (
                    <p className={styles.muted}>{p.is_default ? "La administra el equipo de la plataforma." : "Sin dueño asignado."}</p>
                  ) : (
                    <ul>
                      {owners.map((o) => (
                        <li key={o.email}>
                          <b>{o.pending ? o.email : o.name}</b>
                          {o.pending ? (
                            <span className={styles.pendingRow}>
                              <span className={styles.pending}>Invitación pendiente</span>
                              <button
                                type="button"
                                className={styles.linkBtn}
                                onClick={() => resend(p, o)}
                                disabled={resending !== null}
                                aria-label={`Reenviar la invitación a ${o.email}`}
                              >
                                {resending === o.email ? "Enviando…" : "Reenviar invitación"}
                              </button>
                            </span>
                          ) : (
                            <small>{o.email}</small>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {p.team.length > owners.length && (
                  <div className={styles.owners}>
                    <span className={styles.label}>Resto del equipo</span>
                    <ul>
                      {p.team
                        .filter((m) => m.role !== "Productor")
                        .map((m) => (
                          <li key={m.email}>
                            <b>{m.pending ? m.email : m.name}</b>
                            <small>
                              {m.role}
                              {m.pending ? " · invitación pendiente" : ` · ${m.email}`}
                            </small>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {cardError?.org === p.id && (
                  <p className={styles.cardError} role="alert">
                    {cardError.message}
                  </p>
                )}

                <button type="button" className={styles.secondary} onClick={() => openOwner(p)}>
                  <MaterialIcon decorative name="person_add" />
                  {owners.length === 0 ? "Invitar dueño" : "Invitar otro dueño"}
                </button>

                {!p.is_default && (
                  <button type="button" className={styles.deleteBtn} onClick={() => openDelete(p)} aria-label={`Eliminar la productora ${p.name}`}>
                    <MaterialIcon decorative name="delete" />
                    Eliminar productora
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      <NewProductoraDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(data) => {
          setCreating(false);
          refresh(`Productora «${data.name.trim()}» creada. Enviamos la invitación a ${data.email} para que cree su contraseña y entre al panel.`);
        }}
      />

      <ConfirmDialog
        open={ownerFor !== null}
        kind="form"
        icon="person_add"
        title={ownerFor ? `Invitar dueño a «${ownerFor.name}»` : "Invitar dueño"}
        busy={busy}
        onClose={() => setOwnerFor(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setOwnerFor(null) },
          { label: "Enviar invitación", variant: "primary", onClick: assignOwner, busyLabel: "Enviando…" },
        ]}
      >
        <div className={formStyles.form}>
          <p>
            Tendrá el rol <b>Productor</b>: todo el panel de su productora excepto Apariencia y SEO. Desde Roles puede sumar a su propio equipo.
          </p>
          <label className={formStyles.field}>
            <span>Correo del dueño</span>
            <input data-autofocus type="email" value={email} placeholder="nombre@productora.cl" onChange={(e) => setEmail(e.target.value)} />
          </label>
          <p className={styles.hint}>
            Le llegará un correo para crear su contraseña y entrar a admin.aforiq.cl. No necesita cuenta en Aforiq; si el correo ya es de un
            cliente, usa otro.
          </p>
          {formError && (
            <p className={formStyles.error} role="alert">
              {formError}
            </p>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={toDelete !== null}
        kind={toDelete && toDelete.events === 0 ? "form" : "alert"}
        icon={toDelete && toDelete.events > 0 ? "info" : "delete"}
        title={
          toDelete && toDelete.events > 0 ? `«${toDelete.name}» tiene eventos` : `¿Eliminar «${toDelete?.name ?? ""}»?`
        }
        busy={deleting}
        onClose={closeDelete}
        actions={
          toDelete && toDelete.events > 0
            ? [{ label: "Entendido", variant: "soft", onClick: closeDelete, autoFocus: true }]
            : [
                { label: "Cancelar", variant: "soft", onClick: closeDelete },
                { label: "Eliminar productora", variant: "danger", onClick: confirmDelete, busyLabel: "Eliminando…" },
              ]
        }
      >
        {toDelete && toDelete.events > 0 ? (
          <p>
            Tiene <b>{toDelete.events.toLocaleString("es-CL")}</b> {toDelete.events === 1 ? "evento" : "eventos"}. Para no perder ventas ni
            entradas, una productora solo se puede eliminar cuando no tiene eventos: elimínalos primero desde Eventos.
          </p>
        ) : toDelete ? (
          <div className={formStyles.form}>
            <p>Se elimina la productora con su ficha y sus roles. No se puede deshacer.</p>
            {toDelete.team.length > 0 && (
              <>
                <p>Su equipo pierde el acceso al panel:</p>
                <ul className={styles.deleteList}>
                  {toDelete.team.map((m) => (
                    <li key={m.email}>
                      <b>{m.pending ? m.email : m.name}</b> · {m.role}
                      {!m.pending && <small> {m.email}</small>}
                    </li>
                  ))}
                </ul>
                <p className={styles.hint}>
                  Las cuentas creadas para esta productora se borran. Si alguien del equipo también es cliente, conserva su cuenta de cliente.
                </p>
              </>
            )}
            <label className={formStyles.field}>
              <span>Para confirmar, escribe «{toDelete.name}»</span>
              <input
                data-autofocus
                value={confirmName}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={deleteError ? true : undefined}
                onChange={(e) => {
                  setConfirmName(e.target.value);
                  if (deleteError) setDeleteError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && confirmDelete()}
              />
            </label>
            {deleteError && (
              <p className={formStyles.error} role="alert">
                {deleteError}
              </p>
            )}
          </div>
        ) : null}
      </ConfirmDialog>
    </main>
  );
}

