"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./LoginForm.module.css";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);
    if (signInError) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <h1 className={styles.heading}>
          Inicia
          <br />
          <span className={styles.accent}>sesión</span>
        </h1>
        <p className={styles.subtitle}>Tu próxima gran experiencia te está esperando.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.srOnly}>Correo electrónico</span>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={styles.fieldIcon}>
            <path
              d="M2.5 6.66667L9.075 11.05C9.63506 11.4237 10.3649 11.4237 10.925 11.05L17.5 6.66667M4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333L2.5 6.66667"
              stroke="#9CA3AF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="email"
            name="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.srOnly}>Contraseña</span>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={styles.fieldIcon}>
            <path
              d="M10 12.5V14.1667M5 17.5H15C15.9205 17.5 16.6667 16.7538 16.6667 15.8333V10.8333C16.6667 9.91286 15.9205 9.16667 15 9.16667H5C4.07953 9.16667 3.33333 9.91286 3.33333 10.8333V15.8333C3.33333 16.7538 4.07953 17.5 5 17.5L10 12.5M18.3333 4.16667V5.83333C18.3333 3.99362 16.8397 2.5 15 2.5C13.1603 2.5 11.6667 3.99362 11.6667 5.83333V9.16667H18.3333V4.16667"
              stroke="#9CA3AF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Contraseña"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className={styles.toggleVisibility}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((v) => !v)}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M12.5 10C12.5 11.3798 11.3798 12.5 10 12.5C8.62021 12.5 7.5 11.3798 7.5 10C7.5 8.62021 8.62021 7.5 10 7.5C11.3798 7.5 12.5 8.62021 12.5 10V10"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.04833 10C3.11 6.61917 6.26917 4.16667 10 4.16667C13.7317 4.16667 16.89 6.61917 17.9517 10C16.89 13.3808 13.7317 15.8333 10 15.8333C6.26917 15.8333 3.11 13.3808 2.04833 10V10"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </label>

        <div className={styles.row}>
          <label className={styles.checkboxLabel}>
            <button
              type="button"
              role="checkbox"
              aria-checked={rememberMe}
              className={styles.checkbox}
              data-checked={rememberMe}
              onClick={() => setRememberMe((v) => !v)}
            >
              {rememberMe && (
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M12.207 4.793C12.5974 5.1835 12.5974 5.8165 12.207 6.207L7.207 11.207C6.8165 11.5974 6.1835 11.5974 5.793 11.207L3.793 9.207C3.41403 8.81462 3.41945 8.19092 3.80518 7.80518C4.19092 7.41945 4.81462 7.41403 5.207 7.793L6.5 9.086L10.793 4.793C11.1835 4.40262 11.8165 4.40262 12.207 4.793V4.793"
                    fill="white"
                  />
                </svg>
              )}
            </button>
            Recordarme
          </label>
          <a href="#" className={styles.forgotLink}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submit} disabled={submitting}>
          <span>{submitting ? "Ingresando..." : "Iniciar sesión"}</span>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M9.33333 3.33333L14 8M14 8L9.33333 12.6667M14 8H2"
              stroke="white"
              strokeWidth="1.66667"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className={styles.divider}>
          <span>o continúa con</span>
        </div>

        <div className={styles.socialRow}>
          <button type="button" className={styles.socialButton}>
            <svg viewBox="0 0 14.7 16" fill="none" aria-hidden="true">
              <path
                d="M14.5438 8.16538C14.5438 7.73663 14.5071 7.30788 14.4274 6.8975H7.35V9.65988H11.3925C11.2149 10.5909 10.6943 11.3871 9.9225 11.9139V13.782H12.299C13.6894 12.5019 14.5408 10.6154 14.5408 8.16538H14.5438"
                fill="#4285F4"
              />
              <path
                d="M7.35 15.35C9.3345 15.35 10.9944 14.6885 12.2071 13.5676L9.83063 11.6995C9.16913 12.1405 8.33 12.41 7.35 12.41C5.439 12.41 3.81588 11.1238 3.234 9.39038H0.77175V11.3198C1.99063 13.733 4.48962 15.35 7.35 15.35V15.35"
                fill="#34A853"
              />
              <path
                d="M3.234 9.39038C3.08087 8.94938 3.00125 8.47775 3.00125 8C3.00125 7.52225 3.08087 7.05063 3.234 6.60963V4.68025H0.77175C0.28175 5.648 0 6.76275 0 8C0 9.23725 0.28175 10.352 0.77175 11.3198L3.234 9.39038V9.39038"
                fill="#FBBC05"
              />
              <path
                d="M7.35 3.55937C8.43413 3.55937 9.40188 3.933 10.1675 4.66188L12.2623 2.56712C10.9944 1.37887 9.3345 0.65 7.35 0.65C4.48962 0.65 1.99063 2.267 0.77175 4.68025L3.234 6.60963C3.81588 4.87625 5.439 3.55937 7.35 3.55937V3.55937"
                fill="#EA4335"
              />
            </svg>
            <span>
              Continuar con
              <br />
              Google
            </span>
          </button>
          <button type="button" className={styles.socialButton}>
            <svg viewBox="0 0 15.69 16" fill="none" aria-hidden="true">
              <path
                d="M13.8783 12.1763C13.6521 12.6987 13.3845 13.1795 13.0744 13.6216C12.6517 14.2243 12.3056 14.6415 12.0388 14.8731C11.6254 15.2534 11.1824 15.4481 10.708 15.4592C10.3674 15.4592 9.95669 15.3623 9.47861 15.1657C8.9996 14.9701 8.55843 14.8731 8.15511 14.8731C7.7324 14.8731 7.27924 14.9701 6.79377 15.1657C6.3083 15.3623 5.91698 15.4647 5.61794 15.4749C5.21646 15.4869 4.77253 15.2995 4.28706 14.9138C3.9465 14.6332 3.58563 14.1892 3.20261 13.5819C2.67191 12.7384 2.26582 11.8136 1.98432 10.8076C1.70283 9.80158 1.56162 8.85649 1.56162 7.97047C1.56162 6.6442 1.89295 5.56528 2.55562 4.73279C3.2183 3.9003 4.04525 3.47482 5.03741 3.45544C5.46012 3.45544 5.93913 3.57081 6.47536 3.80154C7.01158 4.03228 7.34938 4.1541 7.48782 4.16703C7.65857 4.14211 8.01944 4.01382 8.57135 3.78124C9.12327 3.54865 9.59121 3.44529 9.97423 3.4702C11.031 3.5302 11.8801 3.92798 12.5206 4.66264C11.5958 5.22564 11.1427 6.00922 11.1611 7.01245C11.1796 7.81633 11.4869 8.49193 12.085 9.03923C12.6821 9.58654 13.391 9.89203 14.2114 9.95664C14.0102 10.5593 13.7684 11.1445 13.486 11.7121L13.8783 12.1763M11.0033 3.26623C11.0033 2.70324 11.2147 2.15501 11.6374 1.62248C12.0601 1.08994 12.5815 0.730915 13.2027 0.546327C13.223 0.686614 13.2331 0.817672 13.2331 0.938577C13.2331 1.50157 13.0172 2.05349 12.5843 2.59433C12.1514 3.13518 11.6226 3.48866 11.0033 3.65479V3.26623"
                fill="black"
              />
            </svg>
            <span>
              Continuar con
              <br />
              Apple
            </span>
          </button>
        </div>
      </form>

      <p className={styles.signupHint}>
        ¿No tienes cuenta? <a href="/registro/">Crear cuenta</a>
      </p>
    </div>
  );
}
