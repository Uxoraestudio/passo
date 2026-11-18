import { NextResponse, type NextRequest } from "next/server";
import { fail, platformAdmin } from "@/lib/productora-server";

const CODES = ["ORG_NOT_FOUND", "IS_DEFAULT", "NAME_MISMATCH", "HAS_EVENTS", "HAS_DATA"] as const;

/**
 * «Eliminar productora»: platform admins only, typing its name to confirm.
 * The database refuses the platform's productora and any with events; its
 * panel-only accounts are deleted with it (admin_delete_productora).
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { orgId?: unknown; name?: unknown } | null;
  const orgId = typeof body?.orgId === "string" ? body.orgId : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!orgId) return fail("ORG_NOT_FOUND", 400);
  if (!name) return fail("NAME_MISMATCH", 400);

  const caller = await platformAdmin();
  if ("response" in caller) return caller.response;

  const { data, error } = await caller.admin.rpc("admin_delete_productora", { p_org_id: orgId, p_name: name });
  if (error) {
    if (error.code === "PGRST202") return fail("MIGRATION_PENDING", 500);
    const code = CODES.find((c) => error.message?.includes(c));
    if (code) return fail(code, code === "ORG_NOT_FOUND" ? 404 : 409);
    console.error("admin_delete_productora failed", orgId, error);
    return fail("DELETE_FAILED", 500);
  }
  return NextResponse.json(data ?? {});
}
