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

/**
 * Pages that only need to know someone is signed in (the purchase flow): the
 * session's signature is checked locally (getClaims) instead of asking Supabase
 * Auth on every page, which matters when many buyers arrive at once.
 */
export async function requireSession(currentPath: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    redirect(loginUrl(currentPath));
  }
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
}

/** Pages that need the user's current profile data (Mi cuenta): asks Supabase Auth. */
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
