import { createClient } from "@/lib/supabase/client";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.session.user.id).single();

  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    await supabase.auth.signOut();
    return { ok: false, error: "Esta cuenta no tiene permisos de administrador." };
  }

  return { ok: true };
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
