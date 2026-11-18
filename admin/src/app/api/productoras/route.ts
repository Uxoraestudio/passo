import { NextResponse, type NextRequest } from "next/server";
import { countryByCode, toE164 } from "@/lib/countries";
import { EMAIL, emailOwner, fail, inviteOwner, platformAdmin } from "@/lib/productora-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/**
 * «Nueva productora»: creates the productora with its profile (country,
 * representative, e-mail, phone) and invites the representative as its owner.
 * All or nothing: if the invitation can't go out the productora is removed,
 * so the admin fixes the data and tries again.
 *
 * With requestId («Aprobar» in Solicitudes) the producer request is marked
 * approved and linked to the new productora.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const country = text(body?.country, 2).toUpperCase();
  const name = text(body?.name, 80);
  const firstName = text(body?.firstName, 60);
  const lastName = text(body?.lastName, 60);
  const email = text(body?.email, 254).toLowerCase();
  const phone = toE164(country, text(body?.phone, 30));
  const requestId = typeof body?.requestId === "string" && UUID.test(body.requestId) ? body.requestId : null;

  if (!countryByCode(country)) return fail("INVALID_COUNTRY", 400);
  if (name.length < 2) return fail("INVALID_NAME", 400);
  if (!firstName) return fail("INVALID_FIRST_NAME", 400);
  if (!lastName) return fail("INVALID_LAST_NAME", 400);
  if (!EMAIL.test(email)) return fail("INVALID_EMAIL", 400);
  if (!phone) return fail("INVALID_PHONE", 400);

  const caller = await platformAdmin();
  if ("response" in caller) return caller.response;
  const { admin, userId } = caller;

  if (requestId) {
    const { data: req } = await admin.from("producer_requests").select("status").eq("id", requestId).maybeSingle();
    if (!req) return fail("REQUEST_NOT_FOUND", 404);
    if (req.status === "aprobado") return fail("REQUEST_ALREADY_APPROVED", 409);
  }

  // Check the e-mail before creating anything.
  const owner = await emailOwner(admin, email);
  if (owner.error) return fail(owner.error, owner.error === "IS_CUSTOMER" || owner.error === "OTHER_TEAM" ? 409 : 500);
  if (owner.existing) return fail("OTHER_TEAM", 409);

  const { data: org, error: createError } = await admin
    .from("organizations")
    .insert({
      name,
      country,
      contact_first_name: firstName,
      contact_last_name: lastName,
      contact_email: email,
      contact_phone: phone,
      created_by: userId,
    })
    .select("id, name")
    .single();
  if (createError || !org) {
    if (createError?.code === "23505") return fail("NAME_TAKEN", 409);
    if (createError?.code === "PGRST204" || createError?.code === "42703") return fail("MIGRATION_PENDING", 500);
    console.error("Create productora failed", createError);
    return fail("CREATE_FAILED", 500);
  }

  const result = await inviteOwner(admin, request, org, email, `${firstName} ${lastName}`);
  if ("error" in result) {
    // Just created, nothing in it yet: remove it so nothing is left half done.
    await admin.from("organizations").delete().eq("id", org.id);
    return fail(result.error, result.http);
  }
  if (requestId) {
    const { error: requestError } = await admin
      .from("producer_requests")
      .update({ status: "aprobado", organization_id: org.id, handled_by: userId, updated_at: new Date().toISOString() })
      .eq("id", requestId);
    // The productora and the invitation already exist; the admin can still mark the request by hand.
    if (requestError) console.error("producer_requests approve failed", requestId, requestError.message);
  }

  return NextResponse.json({ id: org.id, status: result.status });
}
