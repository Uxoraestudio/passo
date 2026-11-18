"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./AdminLoginForm.module.css";

const MIN_LENGTH = 8;

type State = { status: "checking" } | { status: "no-session" } | { status: "ready"; email: string; productora: string | null };

/**
 * Landing of the invitation link (via /auth/confirm/, which already opened the
 * session): the productora's owner picks a password and enters the panel.
 */
export default function CreatePasswordForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "checking" });
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) return setState({ status: "no-session" });
      const { data: access } = await supabase.rpc("my_access");
      if (!active) return;
      setState({ status: "ready", email: data.user.email ?? "", productora: access?.organization?.name ?? null });
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < MIN_LENGTH) return setError(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
    if (password !== repeat) return setError("Las contraseñas no coinciden.");
    setError("");
    setSubmitting(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) {
      setSubmitting(false);
      setError(
        updateError.code === "same_password"
          ? "Esa ya es tu contraseña actual. Elige otra."
          : updateError.code === "weak_password"
            ? "Esa contraseña es muy fácil de adivinar. Usa una más larga o combina letras y números."
            : "No pudimos guardar tu contraseña. Inténtalo de nuevo."
      );
      return;
    }
    router.replace("/inicio/");
  };

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.card}>
        <div className={styles.accentBar} aria-hidden="true" />

        <div className={styles.header}>
          <span className={styles.badge}>Invitación al panel</span>
          <h1 className={styles.title}>
            Crea tu <span className={styles.accent}>contraseña</span>
          </h1>
          <p className={styles.subtitle}>
            {state.status === "ready"
              ? state.productora
                ? `Con ella entrarás a administrar «${state.productora}».`
                : "Con ella entrarás al panel de Aforiq."
              : state.status === "no-session"
                ? "Este enlace ya se usó o venció."
                : "Revisando tu invitación…"}
          </p>
        </div>

        {state.status === "no-session" ? (
          <div className={styles.form}>
            <p className={styles.subtitle}>
              Pide al equipo de Aforiq que te reenvíe la invitación. Si ya creaste tu contraseña, inicia sesión.
            </p>
            <Link href="/login-admin/" className={styles.submit}>
              <span>Ir a iniciar sesión</span>
            </Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {state.status === "ready" && (
              // Lets password managers save the new password under the right account.
              <input type="email" name="email" autoComplete="username" value={state.email} readOnly hidden />
            )}
            <div className={styles.field}>
              <label htmlFor="new-password" className={styles.label}>
                Nueva contraseña
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={`Mínimo ${MIN_LENGTH} caracteres`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={state.status !== "ready"}
                  required
                  minLength={MIN_LENGTH}
                />
                <button
                  type="button"
                  className={styles.toggleVisibility}
                  aria-label={showPassword ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z M2.05 10C3.11 6.62 6.27 4.17 10 4.17s6.89 2.45 7.95 5.83c-1.06 3.38-4.22 5.83-7.95 5.83S3.11 13.38 2.05 10Z"
                      stroke="#938EA2"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="repeat-password" className={styles.label}>
                Repite la contraseña
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="repeat-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  disabled={state.status !== "ready"}
                  required
                />
              </div>
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button type="submit" className={styles.submit} disabled={state.status !== "ready" || submitting}>
              <span>{submitting ? "Guardando…" : "Guardar y entrar al panel"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
