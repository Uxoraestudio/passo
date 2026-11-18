import { NextResponse, type NextRequest } from "next/server";
import { fail, productoraTeamManager } from "@/lib/productora-server";

/**
 * «Quitar acceso» for a productora's own team. A panel-only account (or a
 * pending invitation) only exists for this productora, so it's deleted; the
 * owner can't be removed here, nor can you remove yourself.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
  const userId = typeof body?.userId === "string" ? body.userId : "";
  if (!userId) return fail("USER_NOT_FOUND", 400);

  const caller = await productoraTeamManager();
  if ("response" in caller) return caller.response;
  const { admin, org } = caller;
  if (userId === caller.userId) return fail("SELF", 409);

  const { data: target } = await admin
    .from("profiles")
    .select("id, email, account_type, organization_id, staff_role:staff_roles(name)")
    .eq("id", userId)
    .maybeSingle();
  if (!target || target.organization_id !== org.id) return fail("USER_NOT_FOUND", 404);
  if ((target.staff_role as unknown as { name: string } | null)?.name === "Productor") return fail("OWNER_ROLE", 403);
  // Customers on the team (from before invitations) keep their account: admin_set_member takes them out.
  if (target.account_type !== "productora") return fail("NOT_PRODUCTORA_ACCOUNT", 409);

  const { error } = await admin.auth.admin.deleteUser(target.id);
  if (error) {
    console.error("Remove team member failed", target.id, error.message);
    return fail("REMOVE_FAILED", 500);
  }
  return NextResponse.json({ removed: target.email });
}
