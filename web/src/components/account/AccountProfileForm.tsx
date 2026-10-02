"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./AccountPanels.module.css";

export default function AccountProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const trimmed = name.trim();
  const unchanged = trimmed === initialName.trim();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed || unchanged) return;
    setStatus("saving");
    const { error } = await createClient().auth.updateUser({ data: { full_name: trimmed } });
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("saved");
    router.refresh();
  };

  return (
    <form className={styles.panel} onSubmit={submit}>
      <label className={styles.field}>
        <span>Nombre completo</span>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus("idle");
          }}
          autoComplete="name"
          required
          maxLength={80}
        />
        <small>Debe coincidir con tu documento: puede pedirse en el acceso.</small>
      </label>

      <label className={styles.field}>
        <span>Correo electrónico</span>
        <input type="email" value={email} readOnly aria-readonly="true" />
        <small>Aquí te enviamos tus entradas y comprobantes.</small>
      </label>

      <div className={styles.formFooter}>
        <button type="submit" className={styles.primaryAction} disabled={!trimmed || unchanged || status === "saving"}>
          {status === "saving" ? "Guardando…" : "Guardar cambios"}
        </button>
        <p className={styles.formStatus} role="status" data-tone={status}>
          {status === "saved" && "Cambios guardados."}
          {status === "error" && "No pudimos guardar tus datos. Inténtalo de nuevo."}
        </p>
      </div>
    </form>
  );
}
