import { NextResponse, type NextRequest } from "next/server";
import { EMAIL, fail, inviteOwner, productoraTeamManager } from "@/lib/productora-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * «Agregar miembro» for a productora: invites the person by e-mail with a
 * panel-only account and the chosen role (null = full access). Like the
 * owner's, the e-mail can't be a customer's; sends it again while pending.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; staffRoleId?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const staffRoleId = typeof body?.staffRoleId === "string" && UUID.test(body.staffRoleId) ? body.staffRoleId : null;
  if (!EMAIL.test(email) || email.length > 254) return fail("INVALID_EMAIL", 400);

  const caller = await productoraTeamManager();
  if ("response" in caller) return caller.response;
  const { admin, org } = caller;

  if (staffRoleId) {
    const { data: role } = await admin.from("staff_roles").select("organization_id, name").eq("id", staffRoleId).maybeSingle();
    if (!role || role.organization_id !== org.id) return fail("ROLE_NOT_FOUND", 409);
    if (role.name === "Productor") return fail("OWNER_ROLE", 403);
  }

  const result = await inviteOwner(admin, request, org, email, undefined, staffRoleId);
  if ("error" in result) return fail(result.error, result.http);
  return NextResponse.json(result);
}
