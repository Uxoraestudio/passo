"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { CONTACT_REASONS, MESSAGE_MAX, MESSAGE_MIN, ORDER_REASONS, isReason, type ContactReasonId } from "@/lib/contact";
import styles from "./ContactForm.module.css";

type Values = {
  reason: ContactReasonId | "";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventName: string;
  orderCode: string;
  message: string;
  consent: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function errorsOf(v: Values) {
  return {
    reason: v.reason ? null : "Elige el motivo de tu consulta.",
    firstName: v.firstName.trim() ? null : "Ingresa tu nombre.",
    lastName: v.lastName.trim() ? null : "Ingresa tu apellido.",
    email: EMAIL.test(v.email.trim()) ? null : "Ingresa un correo válido.",
    message:
      v.message.trim().length >= MESSAGE_MIN ? null : `Cuéntanos un poco más (mínimo ${MESSAGE_MIN} caracteres).`,
    consent: v.consent ? null : "Debes aceptar para poder enviar tu consulta.",
  };
}

function Field({ id, label, error, hint, optional, children }: { id: string; label: string; error?: string | null; hint?: ReactNode; optional?: boolean; children: ReactNode }) {
  return (
    <div className={styles.field} data-invalid={Boolean(error)}>
      <label htmlFor={id}>
        {label}
        {optional ? <span className={styles.optional}> (opcional)</span> : <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error ? (
        <p className={styles.error} id={`${id}-error`}>
          {error}
        </p>
      ) : (
        hint && <p className={styles.hint}>{hint}</p>
      )}
    </div>
  );
}

export default function ContactForm({ initial }: { initial: { reason: string; firstName: string; lastName: string; email: string } }) {
  const [values, setValues] = useState<Values>({
    reason: isReason(initial.reason) ? initial.reason : "",
    firstName: initial.firstName,
    lastName: initial.lastName,
    email: initial.email,
    phone: "",
    eventName: "",
    orderCode: "",
    message: "",
    consent: false,
  });
  const [website, setWebsite] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverError, setServerError] = useState("");

  const errors = errorsOf(values);
  const hasErrors = Object.values(errors).some(Boolean);
  const err = (key: keyof typeof errors) => (showErrors ? errors[key] : null);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));
  const orderRelated = values.reason !== "" && ORDER_REASONS.includes(values.reason);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    if (hasErrors) {
      setShowErrors(true);
      window.setTimeout(() => document.querySelector<HTMLElement>("[data-invalid='true'] :is(input, select, textarea)")?.focus(), 0);
      return;
    }
    setStatus("sending");
    setServerError("");
    try {
      const response = await fetch("/api/contacto/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setServerError(body?.error ?? "No pudimos enviar tu mensaje. Inténtalo de nuevo.");
        setStatus("error");
        return;
      }
      setStatus("sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("No hay conexión. Revisa tu internet e inténtalo de nuevo.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <section className={styles.card} aria-live="polite">
        <div className={styles.sent}>
          <span className={styles.sentIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2>¡Recibimos tu mensaje!</h2>
          <p>
            Te responderemos a <strong>{values.email.trim()}</strong>. Si tu consulta es por una compra, ten a mano tu código de orden.
          </p>
          <div className={styles.sentActions}>
            <Link href="/" className={styles.primary}>
              Volver al inicio
            </Link>
            <Link href="/preguntas-frecuentes/" className={styles.secondary}>
              Ver preguntas frecuentes
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form className={styles.card} onSubmit={submit} noValidate aria-labelledby="form-title">
      <div className={styles.header}>
        <h2 id="form-title">Envíanos tu consulta</h2>
        <p>Los campos marcados con * son obligatorios.</p>
      </div>

      <Field id="reason" label="Motivo de la consulta" error={err("reason")}>
        <select id="reason" value={values.reason} onChange={(e) => set("reason", e.target.value as Values["reason"])} aria-invalid={Boolean(err("reason"))}>
          <option value="" disabled>
            Selecciona un motivo
          </option>
          {CONTACT_REASONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>

      {values.reason === "devolucion" && (
        <p className={styles.notice}>
          Las devoluciones corresponden cuando el evento se suspende o se reprograma.{" "}
          <Link href="/preguntas-frecuentes/#cuando-devolucion">Ver condiciones</Link>
        </p>
      )}

      <div className={styles.grid}>
        <Field id="firstName" label="Nombre" error={err("firstName")}>
          <input id="firstName" autoComplete="given-name" maxLength={80} value={values.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Ej. Camila" />
        </Field>
        <Field id="lastName" label="Apellido" error={err("lastName")}>
          <input id="lastName" autoComplete="family-name" maxLength={80} value={values.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Ej. Valenzuela" />
        </Field>
        <Field id="email" label="Correo" error={err("email")} hint="Aquí te enviaremos la respuesta.">
          <input id="email" type="email" autoComplete="email" maxLength={160} value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="tu@correo.com" />
        </Field>
        <Field id="phone" label="Teléfono" optional>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+56 9 1234 5678" />
        </Field>
        <Field id="eventName" label="Evento" optional>
          <input id="eventName" maxLength={160} value={values.eventName} onChange={(e) => set("eventName", e.target.value)} placeholder="Nombre del evento" />
        </Field>
        <Field
          id="orderCode"
          label="Código de orden"
          optional
          hint={orderRelated ? "Empieza con «PS-». Está en tu correo de confirmación y nos ayuda a encontrar tu compra." : "Si tu consulta es por una compra, empieza con «PS-»."}
        >
          <input id="orderCode" autoCapitalize="characters" maxLength={40} value={values.orderCode} onChange={(e) => set("orderCode", e.target.value)} placeholder="PS-XXXXXXXXXX" />
        </Field>
      </div>

      <Field id="message" label="Mensaje" error={err("message")} hint={`${values.message.trim().length}/${MESSAGE_MAX}`}>
        <textarea
          id="message"
          rows={6}
          maxLength={MESSAGE_MAX}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Cuéntanos qué pasó y cómo podemos ayudarte."
        />
      </Field>

      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="website">Sitio web</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className={styles.consent} data-invalid={Boolean(err("consent"))}>
        <label>
          <input type="checkbox" checked={values.consent} onChange={(e) => set("consent", e.target.checked)} />
          <span>Acepto que Aforiq use estos datos para responder mi consulta.</span>
        </label>
        {err("consent") && <p className={styles.error}>{err("consent")}</p>}
      </div>

      {serverError && (
        <p className={styles.formError} role="alert">
          {serverError}
        </p>
      )}
      {showErrors && hasErrors && (
        <p className={styles.formError} role="alert">
          Revisa los campos marcados para enviar tu consulta.
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={status === "sending"} aria-busy={status === "sending"}>
        {status === "sending" ? "Enviando…" : "Enviar consulta"}
        {status !== "sending" && (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M11.7 4.2 17.5 10m0 0-5.8 5.8M17.5 10h-15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </form>
  );
}
