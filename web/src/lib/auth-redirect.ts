import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Only same-site paths; "//host" and "/\host" would be treated as external URLs.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export function loginUrl(next: string) {
  return `/login-usuario/?next=${encodeURIComponent(next)}`;
}

export async function requireUser(currentPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginUrl(currentPath));
  }

  return user;
}
