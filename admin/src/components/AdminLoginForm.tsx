"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import styles from "./AdminLoginForm.module.css";

export default function AdminLoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (login(email, password)) {
      setError("");
      router.push("/inicio/");
    } else {
      setError("Correo o contraseña incorrectos.");
    }
  };

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.card}>
        <div className={styles.accentBar} aria-hidden="true" />

        <div className={styles.header}>
          <span className={styles.badge}>
            <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M5.25 7L6.41667 8.16667L8.75 5.83333M12.0272 3.49067C10.1827 3.58862 8.37476 2.95086 7 1.71733C5.62524 2.95086 3.81727 3.58862 1.97283 3.49067C1.82439 4.06532 1.74952 4.65649 1.75 5.25C1.75 8.51142 3.98067 11.2525 7 12.0295C10.0193 11.2525 12.25 8.512 12.25 5.25C12.25 4.64217 12.1724 4.053 12.0272 3.49067L5.25 7"
                stroke="#FF782D"
                strokeWidth="1.16667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Acceso panel admin
          </span>
          <h1 className={styles.title}>
            Inicia <span className={styles.accent}>sesión</span>
          </h1>
          <p className={styles.subtitle}>
            Ingresa tus credenciales corporativas para
            <br />
            gestionar la plataforma.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="admin-email" className={styles.label}>
              Correo corporativo
            </label>
            <div className={styles.inputWrap}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={styles.inputIcon}>
                <path
                  d="M2.5 6.66667L9.075 11.05C9.63506 11.4237 10.3649 11.4237 10.925 11.05L17.5 6.66667M4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333L2.5 6.66667"
                  stroke="#938EA2"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                id="admin-email"
                type="email"
                name="email"
                placeholder="admin@aforiq.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="admin-password" className={styles.label}>
              Contraseña
            </label>
            <div className={styles.inputWrap}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={styles.inputIcon}>
                <path
                  d="M10 12.5V14.1667M5 17.5H15C15.9205 17.5 16.6667 16.7538 16.6667 15.8333V10.8333C16.6667 9.91286 15.9205 9.16667 15 9.16667H5C4.07953 9.16667 3.33333 9.91286 3.33333 10.8333V15.8333C3.33333 16.7538 4.07953 17.5 5 17.5L10 12.5M18.3333 4.16667V5.83333C18.3333 3.99362 16.8397 2.5 15 2.5C13.1603 2.5 11.6667 3.99362 11.6667 5.83333V9.16667H18.3333V4.16667"
                  stroke="#938EA2"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••••••"
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
                    stroke="#938EA2"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.04833 10C3.11 6.61917 6.26917 4.16667 10 4.16667C13.7317 4.16667 16.89 6.61917 17.9517 10C16.89 13.3808 13.7317 15.8333 10 15.8333C6.26917 15.8333 3.11 13.3808 2.04833 10V10"
                    stroke="#938EA2"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submit}>
            <span>Ingresar al Panel Admin</span>
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

          <div className={styles.divider} />

          <p className={styles.demoHint}>
            Acceso de prueba: <strong>admin@uxoraestudio.com</strong> / <strong>Uxora2026</strong>
          </p>
        </form>
      </div>

      <p className={styles.watermark}>La vida se vive aquí.</p>
    </div>
  );
}
