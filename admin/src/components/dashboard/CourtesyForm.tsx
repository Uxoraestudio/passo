"use client";

import { useState, type FormEvent } from "react";
import { MaterialIcon } from "@/components/icons";
import { courtesyTiers } from "@/lib/tickets-management-data";
import styles from "./CourtesyForm.module.css";

export default function CourtesyForm() {
  const [name, setName] = useState("");
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState(courtesyTiers[0].value);
  const [reason, setReason] = useState("");
  const [sendSms, setSendSms] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tierLabel = courtesyTiers.find((t) => t.value === tier)?.label ?? tier;
    setSuccessMessage(`Ticket VIP emitido a ${name} (${rut}) en sector "${tierLabel}". Notificación enviada a ${email}.`);
    setName("");
    setRut("");
    setEmail("");
    setTier(courtesyTiers[0].value);
    setReason("");
    setSendSms(false);
  };

  return (
    <div className={styles.card}>
      <div>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIconBox}>
              <MaterialIcon name="local_activity" className={styles.headerIcon} />
            </span>
            <h3 className={styles.title}>Emisión Rápida de Cortesías y Prensa</h3>
          </div>
          <span className={styles.costBadge}>Costo $0 CLP</span>
        </div>
        <p className={styles.description}>
          Emisión directa de tickets nominados para media partners, invitados de artistas y autoridades con código QR único
          instantáneo.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="guest-name" className={styles.label}>
              Nombre Completo Titular
            </label>
            <input
              id="guest-name"
              type="text"
              placeholder="Ej. Camila Valenzuela R."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="guest-rut" className={styles.label}>
              RUT o Pasaporte
            </label>
            <input
              id="guest-rut"
              type="text"
              placeholder="18.349.882-K"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="guest-email" className={styles.label}>
              Correo Electrónico de Despacho
            </label>
            <input
              id="guest-email"
              type="email"
              placeholder="camila.prensa@medio.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="guest-tier" className={styles.label}>
              Sector a Asignar
            </label>
            <select id="guest-tier" value={tier} onChange={(e) => setTier(e.target.value)}>
              {courtesyTiers.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="guest-reason" className={styles.label}>
              Motivo / Patrocinador Vinculado
            </label>
            <input
              id="guest-reason"
              type="text"
              placeholder="Ej. Cobertura Revista Rolling Stone / Invitación Productor General"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className={`${styles.fieldFull} ${styles.submitRow}`}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} />
              Enviar ticket también vía SMS con enlace wallet (Apple/Google)
            </label>
            <button type="submit" className={styles.submitButton}>
              <MaterialIcon name="send" className={styles.submitIcon} />
              <span>Emitir Ticket Gratuito</span>
            </button>
          </div>
        </form>
      </div>

      {successMessage && (
        <div className={styles.banner}>
          <div className={styles.bannerLeft}>
            <MaterialIcon name="mark_email_read" className={styles.bannerIcon} />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            className={styles.bannerClose}
            onClick={() => setSuccessMessage(null)}
            aria-label="Cerrar aviso"
          >
            <MaterialIcon name="close" className={styles.bannerCloseIcon} />
          </button>
        </div>
      )}
    </div>
  );
}
