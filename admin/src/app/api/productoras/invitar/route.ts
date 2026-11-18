import { NextResponse, type NextRequest } from "next/server";
import { EMAIL, fail, inviteOwner, platformAdmin } from "@/lib/productora-server";

/**
 * Invites (or invites again) the owner of an existing productora. The e-mail
 * doesn't need an Aforiq account; one that belongs to a customer or to
 * someone else's team is rejected.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { orgId?: unknown; email?: unknown } | null;
  const orgId = typeof body?.orgId === "string" ? body.orgId : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!orgId) return fail("ORG_NOT_FOUND", 400);
  if (!EMAIL.test(email) || email.length > 254) return fail("INVALID_EMAIL", 400);

  const caller = await platformAdmin();
  if ("response" in caller) return caller.response;
  const { admin } = caller;

  const { data: org } = await admin.from("organizations").select("id, name, contact_email, contact_first_name, contact_last_name").eq("id", orgId).maybeSingle();
  if (!org) return fail("ORG_NOT_FOUND", 404);

  // The representative from the productora's profile gets their name on the account.
  const fullName =
    org.contact_email?.toLowerCase() === email ? [org.contact_first_name, org.contact_last_name].filter(Boolean).join(" ") || undefined : undefined;
  const result = await inviteOwner(admin, request, org, email, fullName);
  if ("error" in result) return fail(result.error, result.http);
  return NextResponse.json(result);
}
