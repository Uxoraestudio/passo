import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ServiceKeyMissing, createAdminClient } from "@/lib/supabase/admin";

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

type Admin = ReturnType<typeof createAdminClient>;

/** The caller is a platform admin (same check as the productoras functions); returns the service client. */
export async function platformAdmin(): Promise<{ admin: Admin; userId: string } | { response: NextResponse }> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { response: fail("UNAUTHENTICATED", 401) };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return { response: fail("FORBIDDEN", 403) };
  try {
    return { admin: createAdminClient(), userId };
  } catch (e) {
    if (e instanceof ServiceKeyMissing) return { response: fail("NOT_CONFIGURED", 500) };
    throw e;
  }
}

type Existing = { id: string; role: string; account_type: string; organization_id: string | null };

/** Who already uses this e-mail, if anyone. error: the e-mail can't be the productora's owner. */
export async function emailOwner(admin: Admin, email: string): Promise<{ existing: Existing | null; error?: string }> {
  const { data, error } = await admin.from("profiles").select("id, role, account_type, organization_id").eq("email", email).maybeSingle();
  // account_type is missing until the productora accounts migration runs.
  if (error) return { existing: null, error: error.code === "42703" ? "MIGRATION_PENDING" : "INVITE_FAILED" };
  if (data && data.account_type !== "productora") return { existing: data, error: data.role === "cliente" ? "IS_CUSTOMER" : "OTHER_TEAM" };
  return { existing: data };
}

/**
 * Creates the owner's productora account and lets Supabase e-mail the
 * invitation (link back to /auth/confirm/ on this panel), or sends it again
 * while they haven't signed in. Returns an error code or the outcome.
 */
export async function inviteOwner(
  admin: Admin,
  request: NextRequest,
  org: { id: string; name: string },
  email: string,
  fullName?: string
): Promise<{ status: "invited" | "resent" } | { error: string; http: number }> {
  const owner = await emailOwner(admin, email);
  if (owner.error) return { error: owner.error, http: owner.error === "IS_CUSTOMER" || owner.error === "OTHER_TEAM" ? 409 : 500 };

  const redirectTo = `${request.nextUrl.origin}/auth/confirm/`;
  const invite = () =>
    admin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { organization: org.name, ...(fullName ? { full_name: fullName } : {}) } });

  if (owner.existing) {
    if (owner.existing.organization_id !== org.id) return { error: "OTHER_TEAM", http: 409 };
    const { data: found } = await admin.auth.admin.getUserById(owner.existing.id);
    if (found.user?.last_sign_in_at) return { error: "ALREADY_ACTIVE", http: 409 };
    const { error } = await invite();
    if (error) return { error: error.status === 429 ? "RATE_LIMITED" : "INVITE_FAILED", http: 502 };
    return { status: "resent" };
  }

  const { data: invited, error: inviteError } = await invite();
  if (inviteError || !invited.user) {
    if (inviteError?.code === "email_exists") return { error: "IS_CUSTOMER", http: 409 };
    if (inviteError?.status === 429) return { error: "RATE_LIMITED", http: 429 };
    console.error("Productora invite failed", inviteError);
    return { error: "INVITE_FAILED", http: 502 };
  }

  const { error: attachError } = await admin.rpc("attach_productora_owner", { p_org_id: org.id, p_user_id: invited.user.id });
  if (attachError) {
    console.error("attach_productora_owner failed", attachError);
    // Created by this request a moment ago (the e-mail had no profile): undo it so the admin can retry.
    if (!invited.user.last_sign_in_at) await admin.auth.admin.deleteUser(invited.user.id);
    const code = ["IS_CUSTOMER", "OTHER_TEAM", "ORG_NOT_FOUND"].find((c) => attachError.message?.includes(c));
    if (code) return { error: code, http: 409 };
    return { error: attachError.code === "PGRST202" ? "MIGRATION_PENDING" : "INVITE_FAILED", http: 500 };
  }
  return { status: "invited" };
}
