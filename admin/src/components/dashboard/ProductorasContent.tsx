"use client";

import React, { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import Select from "@/components/Select";
import { COUNTRIES, DEFAULT_COUNTRY, countryByCode, formatPhone, toE164 } from "@/lib/countries";
import { SkeletonCards } from "@/components/Skeleton";
import { managesProductoras, useAccess } from "@/lib/access";
import {
  ProductoraError,
  ProductorasUnavailable,
  createProductora,
  fetchProductoras,
  inviteProductoraOwner,
  type NewProductora,
  type Productora,
  type ProductoraMember,
} from "@/lib/productoras-data";
import ConfirmDialog from "./ConfirmDialog";
import pageStyles from "@/app/inicio/page.module.css";
import formStyles from "./RolesContent.module.css";
import styles from "./ProductorasContent.module.css";

type Field = keyof NewProductora;

const emptyForm: NewProductora = { country: DEFAULT_COUNTRY, name: "", firstName: "", lastName: "", email: "", phone: "" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** First missing or wrong field of the «Nueva productora» form, with its message. */
function validate(f: NewProductora): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (f.name.trim().length < 2) errors.name = "Escribe el nombre de la productora.";
  if (!f.firstName.trim()) errors.firstName = "Escribe el nombre.";
  if (!f.lastName.trim()) errors.lastName = "Escribe el apellido.";
  if (!f.email.trim()) errors.email = "Escribe el correo electrónico.";
  else if (!EMAIL.test(f.email.trim())) errors.email = "Revisa el correo: no parece válido.";
  const country = countryByCode(f.country);
  if (!f.phone.trim()) errors.phone = "Escribe el teléfono.";
  else if (country && !toE164(f.country, f.phone)) {
    const [min, max] = country.phoneDigits;
    errors.phone = `Un teléfono de ${country.name} tiene ${min === max ? min : `${min} a ${max}`} dígitos, sin el +${country.dial}.`;
  }
  return errors;
}

/** Server error code → the field it's about. */
const FIELD_OF: Record<string, Field> = {
  INVALID_NAME: "name",
  NAME_TAKEN: "name",
  INVALID_FIRST_NAME: "firstName",
  INVALID_LAST_NAME: "lastName",
  INVALID_EMAIL: "email",
  IS_CUSTOMER: "email",
  OTHER_TEAM: "email",
  INVALID_PHONE: "phone",
  INVALID_COUNTRY: "country",
};

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
  const [form, setForm] = useState<NewProductora>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  // Owner of an existing one
  const [ownerFor, setOwnerFor] = useState<Productora | null>(null);
  const [email, setEmail] = useState("");

  // Resend a pending invitation
  const [resending, setResending] = useState<string | null>(null);
  const [cardError, setCardError] = useState<{ org: string; message: string } | null>(null);

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
    setForm(emptyForm);
    setFieldErrors({});
    setFormError("");
    setCreating(true);
  };

  const setField = (field: Field, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    // The message goes away as soon as the field is touched again.
    if (fieldErrors[field]) setFieldErrors((e) => ({ ...e, [field]: undefined }));
  };

  const create = async () => {
    const errors = validate(form);
    setFieldErrors(errors);
    setFormError("");
    const first = (Object.keys(errors) as Field[])[0];
    if (first) {
      document.getElementById(`np-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await createProductora({ ...form, email: form.email.trim().toLowerCase() });
      setCreating(false);
      refresh(`Productora «${form.name.trim()}» creada. Enviamos la invitación a ${form.email.trim()} para que cree su contraseña y entre al panel.`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "No pudimos crear la productora.";
      const field = e instanceof ProductoraError ? FIELD_OF[e.code] : undefined;
      if (field) {
        setFieldErrors({ [field]: message });
        document.getElementById(`np-${field}`)?.focus();
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

                {cardError?.org === p.id && (
                  <p className={styles.cardError} role="alert">
                    {cardError.message}
                  </p>
                )}

                <button type="button" className={styles.secondary} onClick={() => openOwner(p)}>
                  <MaterialIcon decorative name="person_add" />
                  {owners.length === 0 ? "Invitar dueño" : "Invitar otro dueño"}
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
        <div className={`${formStyles.form} ${styles.sheet}`}>
          <p>Su representante recibirá una invitación para entrar al panel. La productora empieza sin eventos y solo verá lo que ella cree.</p>

          <fieldset className={styles.group}>
            <legend>Productora</legend>
            <div className={`${styles.row} ${styles.rowWide}`}>
              <div className={formStyles.field}>
                <span aria-hidden="true">País</span>
                <Select
                  id="np-country"
                  size="lg"
                  aria-label="País"
                  value={form.country}
                  onChange={(v) => setField("country", v)}
                  options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
                />
              </div>
              <FormField id="np-name" label="Nombre de la productora" error={fieldErrors.name}>
                <input
                  data-autofocus
                  value={form.name}
                  maxLength={80}
                  placeholder="Ej: Producciones del Sur"
                  onChange={(e) => setField("name", e.target.value)}
                />
              </FormField>
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend>Representante legal o encargado</legend>
            <div className={styles.row}>
              <FormField id="np-firstName" label="Nombre" error={fieldErrors.firstName}>
                <input value={form.firstName} maxLength={60} autoComplete="off" placeholder="Ej: Camila" onChange={(e) => setField("firstName", e.target.value)} />
              </FormField>
              <FormField id="np-lastName" label="Apellido" error={fieldErrors.lastName}>
                <input value={form.lastName} maxLength={60} autoComplete="off" placeholder="Ej: Rojas" onChange={(e) => setField("lastName", e.target.value)} />
              </FormField>
            </div>
            <FormField id="np-email" label="Correo electrónico" error={fieldErrors.email}>
              <input
                type="email"
                value={form.email}
                maxLength={254}
                autoComplete="off"
                placeholder="nombre@productora.cl"
                onChange={(e) => setField("email", e.target.value)}
              />
            </FormField>
            <FormField id="np-phone" label="Teléfono" error={fieldErrors.phone} prefix={`+${countryByCode(form.country)?.dial ?? ""}`}>
              <input
                type="tel"
                inputMode="tel"
                value={form.phone}
                maxLength={20}
                autoComplete="off"
                placeholder={countryByCode(form.country)?.phoneExample}
                onChange={(e) => setField("phone", e.target.value.replace(/[^\d\s]/g, ""))}
              />
            </FormField>
          </fieldset>

          <p className={styles.hint}>
            Al correo le llegará la invitación para crear su contraseña. Es una cuenta solo para el panel, aparte de las de clientes: no puede ser
            un correo con el que se compran entradas en aforiq.cl.
          </p>
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
    </main>
  );
}

/** Label + input with its error under it, linked for screen readers. */
function FormField({
  id,
  label,
  error,
  prefix,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  prefix?: string;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>;
}) {
  const input = React.cloneElement(children, {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  });
  return (
    <div className={`${formStyles.field} ${styles.field}`} data-invalid={error ? "" : undefined}>
      <label htmlFor={id}>{label}</label>
      {prefix ? (
        <div className={styles.prefixed}>
          <span aria-hidden="true">{prefix}</span>
          {input}
        </div>
      ) : (
        input
      )}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}
