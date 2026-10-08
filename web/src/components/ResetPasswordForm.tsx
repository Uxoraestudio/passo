"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./LoginForm.module.css";
import recover from "./RecoverPasswordForm.module.css";

const MIN_LENGTH = 8;

const lockIcon = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={styles.fieldIcon}>
    <rect x="4" y="9" width="12" height="8.5" rx="2" stroke="#9CA3AF" strokeWidth="1.5" />
    <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function ResetPasswordForm() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // The browser client exchanges the recovery code in the URL for a session while it initializes.
    createClient()
      .auth.getSession()
      .then(({ data }) => setLinkState(data.session ? "ready" : "invalid"));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < MIN_LENGTH) {
      setError(`Tu contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) {
      setSaving(false);
      setError(
        updateError.code === "same_password"
          ? "La nueva contraseña debe ser distinta a la anterior."
          : "No pudimos guardar tu nueva contraseña. Solicita un nuevo enlace e inténtalo otra vez."
      );
      return;
    }
    router.push("/mi-cuenta/");
    router.refresh();
  };

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <h1 className={styles.heading}>
          Crea tu nueva
          <br />
          <span className={styles.accent}>contraseña</span>
        </h1>
        <p className={styles.subtitle}>Elige una contraseña segura de al menos {MIN_LENGTH} caracteres.</p>
      </div>

      {linkState === "invalid" ? (
        <div className={styles.form}>
          <p className={styles.error}>
            Este enlace ya no es válido o expiró. Por seguridad, cada enlace sirve una sola vez.
          </p>
          <a href="/recuperar-contrasena/" className={styles.submit}>
            <span>Solicitar un nuevo enlace</span>
          </a>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} aria-busy={linkState === "checking"}>
          <label className={styles.field}>
            <span className={styles.srOnly}>Nueva contraseña</span>
            {lockIcon}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_LENGTH}
              required
              disabled={linkState !== "ready"}
            />
            <button
              type="button"
              className={styles.toggleVisibility}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setShowPassword((v) => !v)}
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" stroke="#9CA3AF" strokeWidth="1.5" />
                <path d="M2.05 10C3.11 6.62 6.27 4.17 10 4.17s6.89 2.45 7.95 5.83C16.89 13.38 13.73 15.83 10 15.83S3.11 13.38 2.05 10Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </button>
          </label>

          <label className={styles.field}>
            <span className={styles.srOnly}>Confirma tu contraseña</span>
            {lockIcon}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirma tu contraseña"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={linkState !== "ready"}
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={linkState !== "ready" || saving}>
            <span>{linkState === "checking" ? "Verificando enlace…" : saving ? "Guardando…" : "Guardar contraseña"}</span>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M9.33333 3.33333L14 8M14 8L9.33333 12.6667M14 8H2" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      )}

      <div className={recover.back}>
        <a href="/login-usuario/">Volver a iniciar sesión</a>
      </div>
    </div>
  );
}
