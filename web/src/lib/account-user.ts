import type { User } from "@supabase/supabase-js";

export function accountDisplayName(user: Pick<User, "email" | "user_metadata">) {
  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  return fullName || (user.email ?? "").split("@")[0] || "Mi cuenta";
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}
