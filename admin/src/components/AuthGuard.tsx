"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AccessContext, allows, firstAllowedHref, type Access, type ModuleKey } from "@/lib/access";
import styles from "./AuthGuard.module.css";

type State = { status: "checking" } | { status: "unauthorized" } | { status: "authorized"; access: Access };

async function loadAccess(): Promise<Access | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "staff") return null;

  const { data, error } = await supabase.rpc("my_access");
  if (error || !data) {
    // Before the roles migration exists every panel user keeps full access.
    return { role: profile.role, staffRoleName: null, permissions: null };
  }
  return {
    role: profile.role,
    staffRoleName: data.staff_role_name ?? null,
    permissions: data.permissions ?? null,
  };
}

export default function AuthGuard({
  children,
  module,
  level = "view",
}: {
  children: React.ReactNode;
  module?: ModuleKey;
  level?: "view" | "edit";
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "checking" });

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const check = async () => {
      const access = await loadAccess();
      if (active) setState(access ? { status: "authorized", access } : { status: "unauthorized" });
    };

    check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state.status === "unauthorized") {
      router.replace("/login-admin/");
    }
  }, [state.status, router]);

  if (state.status !== "authorized") return null;

  if (module && !allows(state.access, module, level)) {
    const fallback = firstAllowedHref(state.access);
    return (
      <main className={styles.denied}>
        <div className={styles.card} role="alert">
          <h1>{level === "edit" && allows(state.access, module) ? "Solo puedes ver esta sección" : "No tienes acceso a esta sección"}</h1>
          <p>
            Tu rol{state.access.staffRoleName ? ` «${state.access.staffRoleName}»` : ""} no incluye permisos para {level === "edit" ? "editarla" : "verla"}. Si lo
            necesitas, pídele a un administrador que actualice tu rol en Roles.
          </p>
          {fallback && (
            <Link href={fallback} className={styles.action}>
              Ir a una sección disponible
            </Link>
          )}
        </div>
      </main>
    );
  }

  return <AccessContext.Provider value={state.access}>{children}</AccessContext.Provider>;
}
