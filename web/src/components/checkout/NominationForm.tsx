"use client";

import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CheckoutOrder } from "@/lib/checkout-order";
import { documentError, formatDocument, cleanDocument } from "@/lib/document";
import CheckoutTopBar from "./CheckoutTopBar";
import OrderSummary, { HelpCard } from "./OrderSummary";
import styles from "./Checkout.module.css";

type Person = { firstName: string; lastName: string; document: string };
type Attendee = Person & { birthDate: string };
type Buyer = Person & { phone: string };

const SAVE_ERRORS: Record<string, string> = {
  ORDER_EXPIRED: "Se acabó el tiempo de tu reserva. Vuelve a elegir tus entradas.",
  PAYMENT_ALREADY_STARTED: "Ya iniciaste el pago de esta compra; no es posible editar los datos.",
  DUPLICATE_DOCUMENT: "Cada entrada debe quedar a nombre de una persona distinta: hay un RUT o pasaporte repetido.",
  DETAILS_INVALID: "Revisa los datos: hay campos incompletos o no válidos.",
};

const TODAY = new Date().toISOString().slice(0, 10);

function personErrors(p: Person) {
  return {
    firstName: p.firstName.trim() ? null : "Ingresa el nombre.",
    lastName: p.lastName.trim() ? null : "Ingresa los apellidos.",
    document: documentError(p.document),
  };
}

function Field({
  id,
  label,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field} data-invalid={Boolean(error)}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className={styles.fieldError} id={`${id}-error`}>
          {error}
        </p>
      ) : (
        hint && <p className={styles.fieldHint}>{hint}</p>
      )}
    </div>
  );
}

export default function NominationForm({ order }: { order: CheckoutOrder }) {
  const router = useRouter();
  const [buyer, setBuyer] = useState<Buyer>({
    firstName: order.buyer.firstName,
    lastName: order.buyer.lastName,
    document: order.buyer.document,
    phone: order.buyer.phone,
  });
  const [buyerAttends, setBuyerAttends] = useState(
    order.attendees.length === 0 ||
      (cleanDocument(order.attendees[0]?.document ?? "") === cleanDocument(order.buyer.document) && order.buyer.document !== "")
  );
  const [attendees, setAttendees] = useState<Attendee[]>(() =>
    order.slots.map((slot) => {
      const saved = order.attendees.find((a) => a.sectorId === slot.sectorId && a.seatLabel === slot.seatLabel);
      return saved
        ? { firstName: saved.firstName, lastName: saved.lastName, document: saved.document, birthDate: saved.birthDate }
        : { firstName: "", lastName: "", document: "", birthDate: "" };
    })
  );
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [expired, setExpired] = useState(!order.editable);
  const onExpire = useCallback(() => setExpired(true), []);

  // When the buyer attends, ticket 1 mirrors their identity (birth date stays per attendee).
  const resolved = attendees.map((a, i) =>
    i === 0 && buyerAttends ? { ...a, firstName: buyer.firstName, lastName: buyer.lastName, document: buyer.document } : a
  );

  const buyerErr = { ...personErrors(buyer), phone: buyer.phone.replace(/\D/g, "").length >= 8 ? null : "Ingresa un teléfono de contacto." };
  const docs = resolved.map((a) => cleanDocument(a.document));
  const attendeeErr = resolved.map((a, i) => {
    const base = personErrors(a);
    const duplicate = docs[i] && docs.indexOf(docs[i]) !== i ? "Este documento ya está en otra entrada." : null;
    return {
      ...base,
      document: base.document ?? duplicate,
      birthDate: !a.birthDate ? "Ingresa la fecha de nacimiento." : a.birthDate > TODAY ? "La fecha no puede ser futura." : null,
    };
  });
  const hasErrors =
    Object.values(buyerErr).some(Boolean) || attendeeErr.some((e) => Object.values(e).some(Boolean));

  const updateAttendee = (index: number, patch: Partial<Attendee>) =>
    setAttendees((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));

  const copyBuyer = (index: number) =>
    updateAttendee(index, { firstName: buyer.firstName, lastName: buyer.lastName, document: buyer.document });

  const err = (value: string | null) => (showErrors ? value : null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (expired || saving) return;
    if (hasErrors) {
      setShowErrors(true);
      setSubmitError("Revisa los campos marcados para continuar.");
      window.setTimeout(() => document.querySelector<HTMLElement>("[data-invalid='true'] input")?.focus(), 0);
      return;
    }
    setSaving(true);
    setSubmitError("");
    const { error } = await createClient().rpc("save_order_details", {
      p_order_id: order.id,
      p_buyer: {
        first_name: buyer.firstName.trim(),
        last_name: buyer.lastName.trim(),
        document: formatDocument(buyer.document),
        phone: buyer.phone.trim(),
      },
      p_attendees: resolved.map((a, i) => ({
        sector_id: order.slots[i].sectorId,
        seat_label: order.slots[i].seatLabel,
        first_name: a.firstName.trim(),
        last_name: a.lastName.trim(),
        document: formatDocument(a.document),
        birth_date: a.birthDate,
      })),
    });
    if (error) {
      const code = Object.keys(SAVE_ERRORS).find((key) => error.message.includes(key));
      setSubmitError(code ? SAVE_ERRORS[code] : "No pudimos guardar tus datos. Inténtalo de nuevo.");
      if (code === "ORDER_EXPIRED") setExpired(true);
      setSaving(false);
      return;
    }
    router.push(`/compra/${order.id}/confirmacion/`);
  };

  const retryHref = `/eventos/${order.event.slug}/entradas/`;

  return (
    <main className={styles.main}>
      <CheckoutTopBar current={1} expiresAt={order.editable ? order.expiresAt : undefined} serverNow={order.serverNow} onExpire={onExpire} />

      <div className={styles.layout}>
        <form id="nomination-form" className={styles.content} onSubmit={handleSubmit} noValidate>
          <Link href={retryHref} className={styles.backLink}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M8.3 4.2 2.5 10m0 0 5.8 5.8M2.5 10h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver a la selección de entradas
          </Link>

          <header className={styles.pageHeader}>
            <span className={styles.stepTag}>Paso 02 de 04</span>
            <h1 className={styles.pageTitle}>Identificación y nominación</h1>
            <p className={styles.pageSubtitle}>Ingresa los datos del titular de la compra y asigna cada entrada a la persona que asistirá.</p>
          </header>

          {expired && (
            <div className={styles.alert} role="alert">
              <p>
                <strong>Tu reserva venció.</strong> Las entradas se liberaron para otros compradores.
              </p>
              <Link href={retryHref}>Elegir entradas de nuevo</Link>
            </div>
          )}

          <fieldset className={styles.card} disabled={expired}>
            <legend className={styles.srOnly}>Datos del comprador</legend>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M5 19.5c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <h2>1. Datos del comprador</h2>
                <p>A esta persona se le emitirá el comprobante de pago.</p>
              </div>
            </div>

            <div className={styles.grid2}>
              <Field id="buyer-first" label="Nombres *" error={err(buyerErr.firstName)}>
                <input id="buyer-first" autoComplete="given-name" value={buyer.firstName} maxLength={80}
                  onChange={(e) => setBuyer({ ...buyer, firstName: e.target.value })} placeholder="Ej. Camila Andrea" />
              </Field>
              <Field id="buyer-last" label="Apellidos *" error={err(buyerErr.lastName)}>
                <input id="buyer-last" autoComplete="family-name" value={buyer.lastName} maxLength={80}
                  onChange={(e) => setBuyer({ ...buyer, lastName: e.target.value })} placeholder="Ej. Valenzuela Soto" />
              </Field>
              <Field id="buyer-doc" label="RUT o pasaporte *" error={err(buyerErr.document)}>
                <input id="buyer-doc" value={buyer.document} maxLength={20} autoCapitalize="characters"
                  onChange={(e) => setBuyer({ ...buyer, document: e.target.value })}
                  onBlur={() => setBuyer((b) => ({ ...b, document: formatDocument(b.document) }))} placeholder="12.345.678-5" />
              </Field>
              <Field id="buyer-phone" label="Teléfono de contacto *" error={err(buyerErr.phone)}>
                <input id="buyer-phone" type="tel" autoComplete="tel" inputMode="tel" value={buyer.phone} maxLength={20}
                  onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} placeholder="+56 9 1234 5678" />
              </Field>
              <Field id="buyer-email" label="Correo electrónico" hint="Es el correo de tu cuenta: ahí llegará tu comprobante.">
                <input id="buyer-email" type="email" value={order.buyer.email} readOnly aria-readonly="true" />
              </Field>
            </div>

            <label className={styles.checkRow}>
              <input type="checkbox" checked={buyerAttends} onChange={(e) => setBuyerAttends(e.target.checked)} />
              <span>El comprador es uno de los asistentes (Entrada 1)</span>
            </label>
          </fieldset>

          <fieldset className={styles.card} disabled={expired}>
            <legend className={styles.srOnly}>Nominación de entradas</legend>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5v-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <h2>2. Nominación de entradas</h2>
                <p>Asigna cada entrada a la persona que asistirá.</p>
              </div>
            </div>

            <p className={styles.callout}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
              <span>
                <strong>Entradas nominativas:</strong> cada entrada queda a nombre de su asistente. Lleva tu cédula de identidad o pasaporte el día del evento.
              </span>
            </p>

            <div className={styles.attendees}>
              {order.slots.map((slot, i) => {
                const locked = i === 0 && buyerAttends;
                const value = resolved[i];
                const e = attendeeErr[i];
                const prefix = `att-${i}`;
                return (
                  <section key={slot.key} className={styles.attendee} data-locked={locked} aria-labelledby={`${prefix}-title`}>
                    <div className={styles.attendeeHead}>
                      <span className={styles.attendeeIndex}>{i + 1}</span>
                      <div className={styles.attendeeTitle}>
                        <h3 id={`${prefix}-title`}>
                          Entrada {i + 1} — {slot.sectorName}
                        </h3>
                        <p>{slot.seatText}</p>
                      </div>
                      {locked ? (
                        <span className={styles.assignedChip}>
                          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                            <path d="m5.3 8.2 1.8 1.8 3.6-3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Comprador asignado
                        </span>
                      ) : (
                        !buyerAttends && (
                          <button type="button" className={styles.copyButton} onClick={() => copyBuyer(i)}>
                            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                              <path d="M3 10.5V3.5A1 1 0 0 1 4 2.5h6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                            Copiar datos del comprador
                          </button>
                        )
                      )}
                    </div>
                    <div className={styles.grid4}>
                      <Field id={`${prefix}-first`} label="Nombre *" error={locked ? null : err(e.firstName)}>
                        <input id={`${prefix}-first`} value={value.firstName} maxLength={80} readOnly={locked}
                          onChange={(ev) => updateAttendee(i, { firstName: ev.target.value })} placeholder="Ej. Matías" />
                      </Field>
                      <Field id={`${prefix}-last`} label="Apellidos *" error={locked ? null : err(e.lastName)}>
                        <input id={`${prefix}-last`} value={value.lastName} maxLength={80} readOnly={locked}
                          onChange={(ev) => updateAttendee(i, { lastName: ev.target.value })} placeholder="Ej. Morales Díaz" />
                      </Field>
                      <Field id={`${prefix}-doc`} label="RUT / documento *" error={err(locked && !e.document?.includes("otra") ? null : e.document)}>
                        <input id={`${prefix}-doc`} value={value.document} maxLength={20} readOnly={locked} autoCapitalize="characters"
                          onChange={(ev) => updateAttendee(i, { document: ev.target.value })}
                          onBlur={() => !locked && updateAttendee(i, { document: formatDocument(attendees[i].document) })}
                          placeholder="12.345.678-K" />
                      </Field>
                      <Field id={`${prefix}-birth`} label="Fecha de nacimiento *" error={err(e.birthDate)}>
                        <input id={`${prefix}-birth`} type="date" max={TODAY} min="1900-01-01" value={value.birthDate}
                          onChange={(ev) => updateAttendee(i, { birthDate: ev.target.value })} />
                      </Field>
                    </div>
                  </section>
                );
              })}
            </div>
          </fieldset>

          {submitError && (
            <p className={styles.formError} role="alert">
              {submitError}
            </p>
          )}

          <div className={styles.formActions}>
            <Link href={retryHref} className={styles.secondaryButton}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M8.3 4.2 2.5 10m0 0 5.8 5.8M2.5 10h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver al paso anterior
            </Link>
            <button type="submit" className={styles.primaryButton} disabled={expired || saving} aria-busy={saving}>
              {saving ? "Guardando…" : "Continuar a confirmación"}
              {!saving && (
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M11.7 4.2 17.5 10m0 0-5.8 5.8M17.5 10h-15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </form>

        <aside className={styles.sidebar}>
          <OrderSummary order={order} title="Desglose de compra">
            <button type="submit" form="nomination-form" className={styles.primaryButton} disabled={expired || saving}>
              {saving ? "Guardando…" : "Continuar a confirmación"}
            </button>
            <Link href={retryHref} className={styles.ghostButton}>
              Volver a la selección
            </Link>
            <p className={styles.guaranteeNote}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>
                <strong>Compra oficial Passo</strong>
                Cada entrada lleva un código QR único a nombre de su asistente.
              </span>
            </p>
          </OrderSummary>
          <HelpCard />
        </aside>
      </div>
    </main>
  );
}
