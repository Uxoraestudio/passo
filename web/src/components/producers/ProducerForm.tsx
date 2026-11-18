"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { EVENT_CATEGORIES, EXPECTED_ATTENDEES, PRODUCER_MESSAGE_MAX, TENTATIVE_DATES } from "@/lib/producers";
import styles from "./ProducerForm.module.css";

type Values = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  eventName: string;
  category: string;
  tentativeDate: string;
  expectedAttendees: string;
  eventUrl: string;
  message: string;
  consent: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STEP_ONE: (keyof Values)[] = ["firstName", "lastName", "company", "email", "phone"];

function errorsOf(v: Values) {
  return {
    firstName: v.firstName.trim() ? null : "Ingresa tu nombre.",
    lastName: v.lastName.trim() ? null : "Ingresa tu apellido.",
    company: v.company.trim() ? null : "Ingresa el nombre de tu productora o empresa.",
    email: EMAIL.test(v.email.trim()) ? null : "Ingresa un correo válido.",
    phone: v.phone.replace(/\D/g, "").length >= 8 ? null : "Ingresa un teléfono de contacto.",
    consent: v.consent ? null : "Debes aceptar para enviar tu solicitud.",
  } as Partial<Record<keyof Values, string | null>>;
}

function Field({ id, label, error, hint, optional, children }: { id: string; label: string; error?: string | null; hint?: ReactNode; optional?: boolean; children: ReactNode }) {
  return (
    <div className={styles.field} data-invalid={Boolean(error)}>
      <label htmlFor={id}>
        {label}
        {optional ? <span className={styles.optional}> (opcional)</span> : <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error ? <p className={styles.error}>{error}</p> : hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

function Select({ id, value, onChange, options, placeholder }: { id: string; value: string; onChange: (v: string) => void; options: readonly string[]; placeholder: string }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export default function ProducerForm({ initial }: { initial: { firstName: string; lastName: string; email: string; signedIn: boolean } }) {
  const [values, setValues] = useState<Values>({
    firstName: initial.firstName,
    lastName: initial.lastName,
    company: "",
    email: initial.email,
    phone: "",
    city: "",
    eventName: "",
    category: "",
    tentativeDate: "",
    expectedAttendees: "",
    eventUrl: "",
    message: "",
    consent: false,
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [shown, setShown] = useState<Set<keyof Values>>(new Set());
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverError, setServerError] = useState("");

  const errors = errorsOf(values);
  const err = (key: keyof Values) => (shown.has(key) ? errors[key] : null);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  const focusFirstInvalid = () =>
    window.setTimeout(() => document.querySelector<HTMLElement>("#solicitud [data-invalid='true'] :is(input, select, textarea)")?.focus(), 0);

  const goNext = () => {
    if (STEP_ONE.some((k) => errors[k])) {
      setShown(new Set(STEP_ONE));
      focusFirstInvalid();
      return;
    }
    setStep(2);
    window.setTimeout(() => document.getElementById("eventName")?.focus(), 0);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) return goNext();
    if (status === "sending") return;
    if (Object.values(errors).some(Boolean)) {
      setShown(new Set([...STEP_ONE, "consent"]));
      if (STEP_ONE.some((k) => errors[k])) setStep(1);
      focusFirstInvalid();
      return;
    }
    setStatus("sending");
    setServerError("");
    try {
      const response = await fetch("/api/productores/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setServerError(body?.error ?? "No pudimos enviar tu solicitud. Inténtalo de nuevo.");
        setStatus("error");
        return;
      }
      setStatus("sent");
      document.getElementById("solicitud")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setServerError("No hay conexión. Revisa tu internet e inténtalo de nuevo.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className={styles.card} aria-live="polite">
        <div className={styles.sent}>
          <span className={styles.sentIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h3>¡Recibimos tu solicitud!</h3>
          <p>
            Nuestro equipo revisará los datos de <strong>{values.company.trim()}</strong> y te contactará a <strong>{values.email.trim()}</strong> para darte
            acceso al panel de productores.
          </p>
          {!initial.signedIn && (
            <p className={styles.tip}>
              Para darte acceso necesitas una cuenta Aforiq con ese mismo correo.{" "}
              <Link href="/registro/">Crea tu cuenta aquí</Link> si aún no la tienes.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className={styles.card} onSubmit={submit} noValidate aria-labelledby="form-title">
      <div className={styles.head}>
        <h3 id="form-title">Cuéntanos de ti y de tu evento</h3>
        <ol className={styles.steps} aria-label="Pasos del formulario">
          <li data-state={step === 1 ? "active" : "done"} aria-current={step === 1 ? "step" : undefined}>
            <span>
              {step === 1 ? (
                "1"
              ) : (
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>{" "}
            Tus datos
          </li>
          <li data-state={step === 2 ? "active" : "todo"} aria-current={step === 2 ? "step" : undefined}>
            <span>2</span> Tu evento
          </li>
        </ol>
      </div>

      {step === 1 ? (
        <div className={styles.grid}>
          <Field id="firstName" label="Nombre" error={err("firstName")}>
            <input id="firstName" autoComplete="given-name" maxLength={80} value={values.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </Field>
          <Field id="lastName" label="Apellido" error={err("lastName")}>
            <input id="lastName" autoComplete="family-name" maxLength={80} value={values.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </Field>
          <Field id="company" label="Productora o empresa" error={err("company")}>
            <input id="company" autoComplete="organization" maxLength={120} value={values.company} onChange={(e) => set("company", e.target.value)} placeholder="Ej. Producciones Pacífico" />
          </Field>
          <Field id="city" label="Ciudad" optional>
            <input id="city" autoComplete="address-level2" maxLength={80} value={values.city} onChange={(e) => set("city", e.target.value)} placeholder="Ej. Santiago" />
          </Field>
          <Field
            id="email"
            label="Correo"
            error={err("email")}
            hint={initial.signedIn ? "Es el correo de tu cuenta: con él te daremos acceso al panel." : "Usa el correo de tu cuenta Aforiq: con él te daremos acceso al panel."}
          >
            <input id="email" type="email" autoComplete="email" maxLength={160} value={values.email} onChange={(e) => set("email", e.target.value)} placeholder="tu@productora.cl" />
          </Field>
          <Field id="phone" label="Teléfono" error={err("phone")}>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+56 9 1234 5678" />
          </Field>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            <Field id="eventName" label="Nombre del evento" optional>
              <input id="eventName" maxLength={160} value={values.eventName} onChange={(e) => set("eventName", e.target.value)} placeholder="Si ya lo tienes definido" />
            </Field>
            <Field id="category" label="Categoría" optional>
              <Select id="category" value={values.category} onChange={(v) => set("category", v)} options={EVENT_CATEGORIES} placeholder="Selecciona una categoría" />
            </Field>
            <Field id="tentativeDate" label="Fecha tentativa" optional>
              <Select id="tentativeDate" value={values.tentativeDate} onChange={(v) => set("tentativeDate", v)} options={TENTATIVE_DATES} placeholder="Selecciona una opción" />
            </Field>
            <Field id="expectedAttendees" label="Asistentes esperados" optional>
              <Select
                id="expectedAttendees"
                value={values.expectedAttendees}
                onChange={(v) => set("expectedAttendees", v)}
                options={EXPECTED_ATTENDEES}
                placeholder="Selecciona una opción"
              />
            </Field>
          </div>
          <Field id="eventUrl" label="Enlace del evento o de tu productora" optional>
            <input id="eventUrl" type="url" inputMode="url" maxLength={300} value={values.eventUrl} onChange={(e) => set("eventUrl", e.target.value)} placeholder="https://instagram.com/tuproductora" />
          </Field>
          <Field id="message" label="Mensaje" optional>
            <textarea
              id="message"
              rows={4}
              maxLength={PRODUCER_MESSAGE_MAX}
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Cuéntanos lo que necesitas: tipo de venta, sectores numerados, preventas…"
            />
          </Field>
          <div className={styles.consent} data-invalid={Boolean(err("consent"))}>
            <label>
              <input type="checkbox" checked={values.consent} onChange={(e) => set("consent", e.target.checked)} />
              <span>Acepto que Aforiq use estos datos para contactarme por mi solicitud.</span>
            </label>
            {err("consent") && <p className={styles.error}>{err("consent")}</p>}
          </div>
        </>
      )}

      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="website">Sitio web</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {serverError && (
        <p className={styles.formError} role="alert">
          {serverError}
        </p>
      )}

      <div className={styles.actions}>
        {step === 2 && (
          <button type="button" className={styles.back} onClick={() => setStep(1)}>
            ← Volver
          </button>
        )}
        <button type="submit" className={styles.submit} disabled={status === "sending"} aria-busy={status === "sending"}>
          {step === 1 ? "Siguiente" : status === "sending" ? "Enviando…" : "Enviar solicitud"}
          {status !== "sending" && (
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M11.7 4.2 17.5 10m0 0-5.8 5.8M17.5 10h-15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
