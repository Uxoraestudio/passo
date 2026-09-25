"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./LoginForm.module.css";

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message === "User already registered" ? "Ya existe una cuenta con ese correo." : "No pudimos crear tu cuenta. Intenta de nuevo.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <h1 className={styles.heading}>
          Crea tu
          <br />
          <span className={styles.accent}>cuenta</span>
        </h1>
        <p className={styles.subtitle}>Regístrate para comprar entradas a tu próxima gran experiencia.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.srOnly}>Nombre completo</span>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={styles.fieldIcon}>
            <path
              d="M10 10C12.3012 10 14.1667 8.13452 14.1667 5.83333C14.1667 3.53215 12.3012 1.66667 10 1.66667C7.69882 1.66667 5.83333 3.53215 5.83333 5.83333C5.83333 8.13452 7.69882 10 10 10ZM10 10C5.85786 10 2.5 13.3579 2.5 17.5"
              stroke="#9CA3AF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M10 10C14.1421 10 17.5 13.3579 17.5 17.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            name="name"
            placeholder="Tu nombre completo"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>

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
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            minLength={6}
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

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submit} disabled={submitting}>
          <span>{submitting ? "Creando cuenta..." : "Crear cuenta"}</span>
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
      </form>

      <p className={styles.signupHint}>
        ¿Ya tienes cuenta? <a href="/login-usuario/">Inicia sesión</a>
      </p>
    </div>
  );
}
