"use client";

import { useEffect, useState } from "react";
import styles from "./Checkout.module.css";

const STEPS = ["Entradas", "Tus datos", "Confirmación", "Pago"];

function format(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * `serverNow` aligns the countdown with the database clock, so a skewed
 * device clock can't show time the reservation doesn't have.
 */
export default function CheckoutTopBar({
  current,
  expiresAt,
  serverNow,
  onExpire,
}: {
  current: number;
  expiresAt?: string;
  serverNow?: number;
  onExpire?: () => void;
}) {
  const [offset] = useState(() => (serverNow ? serverNow - Date.now() : 0));
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const deadline = new Date(expiresAt).getTime();
    let fired = false;
    const tick = () => {
      const left = deadline - (Date.now() + offset);
      setRemaining(left);
      if (left <= 0 && !fired) {
        fired = true;
        onExpire?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, offset, onExpire]);

  const urgent = remaining !== null && remaining <= 2 * 60 * 1000;

  return (
    <div className={styles.topBar}>
      <ol className={styles.steps} aria-label="Pasos de la compra">
        {STEPS.map((step, index) => {
          const state = index < current ? "done" : index === current ? "active" : "todo";
          return (
            <li key={step} className={styles.step} data-state={state} aria-current={state === "active" ? "step" : undefined}>
              <span className={styles.stepNumber}>
                {state === "done" ? (
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span className={styles.stepLabel}>
                {index + 1}. {step}
                {state === "done" && <span className={styles.srOnly}> (completado)</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {expiresAt && remaining !== null && (
        <p className={styles.holdPill} data-urgent={urgent} role="timer" aria-live="off">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tu selección se guarda por <strong>{format(remaining)} min</strong>
        </p>
      )}
    </div>
  );
}
