"use client";

import React, { useEffect, useState } from "react";
import Select from "@/components/Select";
import { COUNTRIES, DEFAULT_COUNTRY, countryByCode, toE164 } from "@/lib/countries";
import { ProductoraError, createProductora, type NewProductora } from "@/lib/productoras-data";
import ConfirmDialog from "./ConfirmDialog";
import formStyles from "./RolesContent.module.css";
import styles from "./ProductorasContent.module.css";

type Field = keyof NewProductora;

export const emptyProductora: NewProductora = { country: DEFAULT_COUNTRY, name: "", firstName: "", lastName: "", email: "", phone: "" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Missing or wrong fields of the form, with their messages. */
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
 * «Nueva productora»: the productora's profile and its representative, who
 * gets the invitation to the panel. Used from Productoras and, prefilled with
 * a producer request, from Solicitudes («Aprobar»).
 */
export default function NewProductoraDialog({
  open,
  initial = emptyProductora,
  requestId,
  title = "Nueva productora",
  submitLabel = "Crear productora",
  intro = "Su representante recibirá una invitación para entrar al panel. La productora empieza sin eventos y solo verá lo que ella cree.",
  onClose,
  onCreated,
}: {
  open: boolean;
  initial?: NewProductora;
  /** Producer request being approved. */
  requestId?: string;
  title?: string;
  submitLabel?: string;
  intro?: string;
  onClose: () => void;
  onCreated: (data: NewProductora) => void;
}) {
  const [form, setForm] = useState<NewProductora>(initial);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  // Each opening starts from the given data (blank, or the request's).
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      setForm(initial);
      setFieldErrors({});
      setFormError("");
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, initial]);

  const setField = (field: Field, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    // The message goes away as soon as the field is touched again.
    if (fieldErrors[field]) setFieldErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async () => {
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
      const data = { ...form, email: form.email.trim().toLowerCase() };
      await createProductora({ ...data, requestId });
      onCreated(data);
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

  const country = countryByCode(form.country);

  return (
    <ConfirmDialog
      open={open}
      kind="form"
      icon="add_business"
      title={title}
      busy={busy}
      onClose={onClose}
      actions={[
        { label: "Cancelar", variant: "soft", onClick: onClose },
        { label: submitLabel, variant: "primary", onClick: submit, busyLabel: "Creando…" },
      ]}
    >
      <div className={`${formStyles.form} ${styles.sheet}`}>
        <p>{intro}</p>

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
              <input data-autofocus value={form.name} maxLength={80} placeholder="Ej: Producciones del Sur" onChange={(e) => setField("name", e.target.value)} />
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
          <FormField id="np-phone" label="Teléfono" error={fieldErrors.phone} prefix={`+${country?.dial ?? ""}`}>
            <input
              type="tel"
              inputMode="tel"
              value={form.phone}
              maxLength={20}
              autoComplete="off"
              placeholder={country?.phoneExample}
              onChange={(e) => setField("phone", e.target.value.replace(/[^\d\s]/g, ""))}
            />
          </FormField>
        </fieldset>

        <p className={styles.hint}>
          Al correo le llegará la invitación para crear su contraseña. Es una cuenta solo para el panel, aparte de las de clientes: no puede ser un
          correo con el que se compran entradas en aforiq.cl.
        </p>
        {formError && (
          <p className={formStyles.error} role="alert">
            {formError}
          </p>
        )}
      </div>
    </ConfirmDialog>
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
