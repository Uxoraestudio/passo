"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./AccountPanels.module.css";

export type NotificationPrefs = { eventReminders: boolean; presales: boolean; newsletter: boolean };

const DEFAULT_PREFS: NotificationPrefs = { eventReminders: true, presales: true, newsletter: false };

const OPTIONS: { key: keyof NotificationPrefs; title: string; text: string }[] = [
  { key: "eventReminders", title: "Recordatorios de mis eventos", text: "Te avisamos el día antes con la hora de apertura y cómo llegar." },
  { key: "presales", title: "Preventas y lanzamientos", text: "Entérate primero cuando salen a la venta los eventos que te interesan." },
  { key: "newsletter", title: "Novedades de Passo", text: "Un resumen ocasional con lo mejor de la cartelera." },
];

export default function AccountNotifications({ initialPrefs }: { initialPrefs: NotificationPrefs | null }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>({ ...DEFAULT_PREFS, ...initialPrefs });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const toggle = async (key: keyof NotificationPrefs) => {
    const previous = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setStatus("saving");
    const { error } = await createClient().auth.updateUser({ data: { notification_prefs: next } });
    if (error) {
      setPrefs(previous);
      setStatus("error");
      return;
    }
    setStatus("saved");
  };

  return (
    <div className={styles.panel}>
      <ul className={styles.toggleList}>
        {OPTIONS.map((option) => (
          <li key={option.key}>
            <div>
              <p className={styles.toggleTitle} id={`pref-${option.key}`}>
                {option.title}
              </p>
              <p className={styles.toggleText}>{option.text}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[option.key]}
              aria-labelledby={`pref-${option.key}`}
              className={styles.switch}
              onClick={() => toggle(option.key)}
              disabled={status === "saving"}
            >
              <span />
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.formStatus} role="status" data-tone={status}>
        {status === "saved" && "Preferencias guardadas."}
        {status === "error" && "No pudimos guardar el cambio. Inténtalo de nuevo."}
      </p>
    </div>
  );
}
