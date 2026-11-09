"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { SkeletonCards } from "@/components/Skeleton";
import { managesProductoras, useAccess } from "@/lib/access";
import { ProductorasUnavailable, createProductora, fetchProductoras, setProductoraOwner, type Productora } from "@/lib/productoras-data";
import ConfirmDialog from "./ConfirmDialog";
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
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  // Owner of an existing one
  const [ownerFor, setOwnerFor] = useState<Productora | null>(null);
  const [email, setEmail] = useState("");

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
    setName("");
    setOwnerEmail("");
    setFormError("");
    setCreating(true);
  };

  const create = async () => {
    if (name.trim().length < 2) {
      setFormError("Escribe el nombre de la productora.");
      return;
    }
    setBusy(true);
    setFormError("");
    let id: string | null = null;
    try {
      id = await createProductora(name);
      if (ownerEmail.trim()) await setProductoraOwner(id, ownerEmail);
      setCreating(false);
      refresh(ownerEmail.trim() ? `Productora «${name.trim()}» creada con ${ownerEmail.trim()} como dueño.` : `Productora «${name.trim()}» creada.`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "No pudimos crear la productora.";
      // The productora exists even if the owner failed: say so and let them retry from the list.
      if (id) {
        setCreating(false);
        refresh(`Productora «${name.trim()}» creada, pero no pudimos asignar el dueño: ${message}`);
      } else {
        setFormError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const openOwner = (p: Productora) => {
    setEmail("");
    setFormError("");
    setOwnerFor(p);
  };

  const assignOwner = async () => {
    if (!ownerFor || !email.trim()) {
      setFormError("Escribe el correo de la cuenta.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      await setProductoraOwner(ownerFor.id, email);
      setOwnerFor(null);
      refresh(`${email.trim()} ahora administra «${ownerFor.name}».`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No pudimos asignar el dueño.");
    } finally {
      setBusy(false);
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

                <div className={styles.owners}>
                  <span className={styles.label}>Dueño</span>
                  {owners.length === 0 ? (
                    <p className={styles.muted}>{p.is_default ? "La administra el equipo de la plataforma." : "Sin dueño asignado."}</p>
                  ) : (
                    <ul>
                      {owners.map((o) => (
                        <li key={o.email}>
                          <b>{o.name}</b>
                          <small>{o.email}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button type="button" className={styles.secondary} onClick={() => openOwner(p)}>
                  <MaterialIcon decorative name="person_add" />
                  {owners.length === 0 ? "Asignar dueño" : "Agregar otro dueño"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={creating}
        kind="form"
        icon="add_business"
        title="Nueva productora"
        busy={busy}
        onClose={() => setCreating(false)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setCreating(false) },
          { label: "Crear productora", variant: "primary", onClick: create, busyLabel: "Creando…" },
        ]}
      >
        <div className={formStyles.form}>
          <p>La productora empieza sin eventos. Su dueño entra al panel y solo ve lo que su productora cree.</p>
          <label className={formStyles.field}>
            <span>Nombre de la productora</span>
            <input data-autofocus value={name} maxLength={80} placeholder="Ej: Producciones del Sur" onChange={(e) => setName(e.target.value)} />
          </label>
          <label className={formStyles.field}>
            <span>Correo del dueño (opcional)</span>
            <input type="email" value={ownerEmail} placeholder="nombre@productora.cl" onChange={(e) => setOwnerEmail(e.target.value)} />
          </label>
          <p className={styles.hint}>La persona debe haberse registrado antes en aforiq.cl con ese correo. Puedes asignarlo después.</p>
          {formError && (
            <p className={formStyles.error} role="alert">
              {formError}
            </p>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={ownerFor !== null}
        kind="form"
        icon="person_add"
        title={ownerFor ? `Dueño de «${ownerFor.name}»` : "Dueño"}
        busy={busy}
        onClose={() => setOwnerFor(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setOwnerFor(null) },
          { label: "Asignar dueño", variant: "primary", onClick: assignOwner, busyLabel: "Guardando…" },
        ]}
      >
        <div className={formStyles.form}>
          <p>
            Tendrá el rol <b>Productor</b>: todo el panel de su productora excepto Apariencia y SEO. Desde Roles puede sumar a su propio equipo.
          </p>
          <label className={formStyles.field}>
            <span>Correo de la cuenta</span>
            <input data-autofocus type="email" value={email} placeholder="nombre@productora.cl" onChange={(e) => setEmail(e.target.value)} />
          </label>
          <p className={styles.hint}>La persona debe haberse registrado antes en aforiq.cl con ese correo.</p>
          {formError && (
            <p className={formStyles.error} role="alert">
              {formError}
            </p>
          )}
        </div>
      </ConfirmDialog>
    </main>
  );
}
