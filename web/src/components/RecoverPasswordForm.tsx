"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./LoginForm.module.css";
import recover from "./RecoverPasswordForm.module.css";

const mailIcon = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={styles.fieldIcon}>
    <path
      d="M2.5 6.66667L9.075 11.05C9.63506 11.4237 10.3649 11.4237 10.925 11.05L17.5 6.66667M4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333L2.5 6.66667"
      stroke="#9CA3AF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/restablecer-contrasena/`,
    });
    // Same message whether or not the address has an account, so the form can't be used to probe for users.
    setStatus(error && error.status !== 400 && error.status !== 404 ? "error" : "sent");
  };

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <h1 className={styles.heading}>
          Recupera tu
          <br />
          <span className={styles.accent}>contraseña</span>
        </h1>
        <p className={styles.subtitle}>Te enviaremos un enlace para que puedas crear una nueva contraseña.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.srOnly}>Correo electrónico</span>
          {mailIcon}
          <input
            type="email"
            name="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "sending") setStatus("idle");
            }}
            required
          />
        </label>

        <button type="submit" className={styles.submit} disabled={status === "sending"}>
          <span>{status === "sending" ? "Enviando…" : status === "sent" ? "Reenviar enlace" : "Enviar enlace"}</span>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M9.33333 3.33333L14 8M14 8L9.33333 12.6667M14 8H2" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div role="status" aria-live="polite">
          {status === "sent" && (
            <div className={recover.notice} data-tone="success">
              <span className={recover.noticeIcon} aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="m4 8.3 2.6 2.6L12 5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className={recover.noticeTitle}>¡Listo!</p>
                <p className={recover.noticeText}>
                  Si <strong>{email.trim()}</strong> tiene una cuenta en Passo, te enviamos un enlace para restablecer tu contraseña.
                  Revisa también tu carpeta de spam.
                </p>
              </div>
            </div>
          )}
          {status === "error" && (
            <p className={styles.error}>No pudimos enviar el enlace en este momento. Espera un minuto e inténtalo de nuevo.</p>
          )}
        </div>
      </form>

      <div className={recover.back}>
        <a href="/login-usuario/">Volver a iniciar sesión</a>
      </div>
    </div>
  );
}
