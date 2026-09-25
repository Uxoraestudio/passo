"use client";

import { useState, type FormEvent } from "react";
import styles from "./NewsletterForm.module.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "error" | "success";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!EMAIL_REGEX.test(email.trim())) {
      setStatus("error");
      return;
    }
    // No backend yet — mocked success. Wire to a real subscribe endpoint when one exists.
    setStatus("success");
    setEmail("");
  };

  return (
    <div>
      <form className={styles.newsletterForm} onSubmit={onSubmit} noValidate>
        <input
          type="email"
          placeholder="Tu correo electrónico"
          aria-label="Tu correo electrónico"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          data-invalid={status === "error"}
        />
        <button type="submit" aria-label="Suscribirse al newsletter">
          <svg viewBox="0 0 20 20" fill="white" aria-hidden="true">
            <path d="M19.5817 5.155C19.3517 4.28884 18.678 3.61064 17.8133 3.375C16.2542 2.95417 10 2.95417 10 2.95417C10 2.95417 3.74583 2.95417 2.18583 3.375C1.32161 3.61105 0.648284 4.28913 0.418333 5.155C0 6.725 0 10 0 10C0 10 0 13.275 0.418333 14.845C0.64828 15.7112 1.32203 16.3894 2.18667 16.625C3.74583 17.0458 10 17.0458 10 17.0458C10 17.0458 16.2542 17.0458 17.8142 16.625C18.6789 16.3895 19.3527 15.7113 19.5825 14.845C20 13.275 20 10 20 10C20 10 20 6.725 19.5817 5.155V5.155M7.95417 12.9733V7.02667L13.1817 10L7.95417 12.9733V12.9733" />
          </svg>
        </button>
      </form>
      <p className={styles.feedback} data-status={status} role="status" aria-live="polite">
        {status === "error" && "Ingresa un correo electrónico válido."}
        {status === "success" && "¡Listo! Te enviaremos novedades."}
      </p>
    </div>
  );
}
