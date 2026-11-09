"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/icons";
import { Skeleton } from "@/components/Skeleton";
import { allows, useAccess, type ModuleKey } from "@/lib/access";
import { startOnboarding } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";
import pageStyles from "@/app/inicio/page.module.css";
import styles from "./ConfigContent.module.css";

type Account = { id: string; name: string; email: string };

const shortcuts: { module: ModuleKey; href: string; icon: string; title: string; text: string }[] = [
  { module: "apariencia", href: "/apariencia/", icon: "palette", title: "Apariencia", text: "Tu logo y los colores del sitio de venta." },
  { module: "seo", href: "/seo/", icon: "travel_explore", title: "Google y redes", text: "Cómo se ve tu sitio en Google y al compartir el enlace." },
  { module: "roles", href: "/roles/", icon: "group_add", title: "Equipo y permisos", text: "Quién entra al panel y qué puede ver o editar." },
];

const MIN_PASSWORD = 8;

export default function ConfigContent() {
  const access = useAccess();
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [nameState, setNameState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passState, setPassState] = useState<"idle" | "saving" | "saved">("idle");
  const [passError, setPassError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("profiles").select("full_name, email").eq("id", session.user.id).single();
      if (!active) return;
      const email = data?.email ?? session.user.email ?? "";
      setAccount({ id: session.user.id, name: data?.full_name?.trim() ?? "", email });
      setName(data?.full_name?.trim() ?? "");
    })();
    return () => {
      active = false;
    };
  }, []);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !name.trim()) return;
    setNameState("saving");
    const { error } = await createClient().from("profiles").update({ full_name: name.trim() }).eq("id", account.id);
    if (error) {
      setNameState("error");
      return;
    }
    setAccount({ ...account, name: name.trim() });
    setNameState("saved");
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (password.length < MIN_PASSWORD) return setPassError(`Usa al menos ${MIN_PASSWORD} caracteres.`);
    if (password !== confirm) return setPassError("Las dos contraseñas no coinciden.");
    setPassState("saving");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setPassState("idle");
      setPassError(
        error.message.toLowerCase().includes("different")
          ? "La nueva contraseña debe ser distinta de la actual."
          : "No pudimos cambiar la contraseña. Cierra sesión, vuelve a entrar e inténtalo otra vez."
      );
      return;
    }
    setPassword("");
    setConfirm("");
    setPassState("saved");
  };

  const nameChanged = account !== null && name.trim() !== account.name;
  const visibleShortcuts = shortcuts.filter((s) => allows(access, s.module));
  const role = access.role === "admin" ? "Administrador" : (access.staffRoleName ?? "Equipo");

  return (
    <main className={pageStyles.main}>
      <div className={pageStyles.heroRow}>
        <div>
          <h1 className={pageStyles.pageTitle}>Configuración</h1>
          <p className={pageStyles.pageSubtitle}>Tu cuenta y los ajustes del panel.</p>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="cfg-account">
          <header className={styles.cardHead}>
            <span className={styles.cardIcon} aria-hidden="true">
              <MaterialIcon decorative name="person" />
            </span>
            <div>
              <h2 id="cfg-account" className={styles.cardTitle}>
                Tu cuenta
              </h2>
              <p className={styles.cardText}>Así te ve tu equipo en el panel.</p>
            </div>
          </header>

          <form className={styles.form} onSubmit={saveName}>
            <label className={styles.field}>
              <span className={styles.label}>Nombre</span>
              {account ? (
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameState("idle");
                  }}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Tu nombre y apellido"
                />
              ) : (
                <Skeleton height={44} radius={10} />
              )}
            </label>
            <div className={styles.readonlyRow}>
              <div>
                <span className={styles.label}>Correo</span>
                <p className={styles.readonly}>{account ? account.email : <Skeleton width={200} height={14} />}</p>
              </div>
              <div>
                <span className={styles.label}>Rol</span>
                <p className={styles.readonly}>{role}</p>
              </div>
            </div>
            <div className={styles.actions}>
              {nameState === "saved" && !nameChanged && (
                <span className={styles.ok} role="status">
                  <MaterialIcon decorative name="check_circle" /> Nombre guardado
                </span>
              )}
              {nameState === "error" && (
                <span className={styles.error} role="alert">
                  No pudimos guardar el nombre. Inténtalo de nuevo.
                </span>
              )}
              <button type="submit" className={styles.primary} disabled={!nameChanged || !name.trim() || nameState === "saving"}>
                {nameState === "saving" ? "Guardando…" : "Guardar nombre"}
              </button>
            </div>
          </form>
        </section>

        <section className={styles.card} aria-labelledby="cfg-password">
          <header className={styles.cardHead}>
            <span className={styles.cardIcon} aria-hidden="true">
              <MaterialIcon decorative name="lock" />
            </span>
            <div>
              <h2 id="cfg-password" className={styles.cardTitle}>
                Contraseña
              </h2>
              <p className={styles.cardText}>Cámbiala cuando quieras. Usa al menos {MIN_PASSWORD} caracteres.</p>
            </div>
          </header>

          <form className={styles.form} onSubmit={savePassword}>
            {/* Lets password managers save the new password for this account. */}
            <input type="email" autoComplete="username" value={account?.email ?? ""} readOnly hidden />
            <label className={styles.field}>
              <span className={styles.label}>Nueva contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPassState("idle");
                }}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Repite la nueva contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setPassState("idle");
                }}
                aria-invalid={!!passError || undefined}
                aria-describedby={passError ? "cfg-pass-error" : undefined}
              />
            </label>
            <div className={styles.actions}>
              {passError && (
                <span className={styles.error} id="cfg-pass-error" role="alert">
                  {passError}
                </span>
              )}
              {passState === "saved" && (
                <span className={styles.ok} role="status">
                  <MaterialIcon decorative name="check_circle" /> Contraseña cambiada
                </span>
              )}
              <button type="submit" className={styles.primary} disabled={!password || !confirm || passState === "saving"}>
                {passState === "saving" ? "Cambiando…" : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        </section>

        {visibleShortcuts.length > 0 && (
          <section className={`${styles.card} ${styles.wide}`} aria-labelledby="cfg-site">
            <header className={styles.cardHead}>
              <span className={styles.cardIcon} aria-hidden="true">
                <MaterialIcon decorative name="tune" />
              </span>
              <div>
                <h2 id="cfg-site" className={styles.cardTitle}>
                  Ajustes del sitio
                </h2>
                <p className={styles.cardText}>Cada ajuste tiene su propia pantalla.</p>
              </div>
            </header>
            <div className={styles.shortcuts}>
              {visibleShortcuts.map((s) => (
                <Link key={s.href} href={s.href} className={styles.shortcut}>
                  <MaterialIcon decorative name={s.icon} className={styles.shortcutIcon} />
                  <span>
                    <span className={styles.shortcutTitle}>{s.title}</span>
                    <span className={styles.shortcutText}>{s.text}</span>
                  </span>
                  <MaterialIcon decorative name="chevron_right" className={styles.chevron} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={`${styles.card} ${styles.wide}`} aria-labelledby="cfg-help">
          <header className={styles.cardHead}>
            <span className={styles.cardIcon} aria-hidden="true">
              <MaterialIcon decorative name="help" />
            </span>
            <div>
              <h2 id="cfg-help" className={styles.cardTitle}>
                Ayuda
              </h2>
              <p className={styles.cardText}>Si es tu primera vez o quieres repasar qué hace cada sección.</p>
            </div>
          </header>
          <div className={styles.helpRow}>
            <button type="button" className={styles.secondary} onClick={startOnboarding}>
              <MaterialIcon decorative name="tour" /> Ver guía del panel
            </button>
            <p className={styles.note}>
              <MaterialIcon decorative name="info" />
              Los pagos se cobran con Flow y los correos de compra se envían solos. Si necesitas cambiar la cuenta de cobro, pídeselo al equipo técnico.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
