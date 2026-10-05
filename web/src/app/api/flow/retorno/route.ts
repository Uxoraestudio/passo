import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncFlowPayment } from "@/lib/payments";

// Flow sends the buyer's browser back here with the payment token. Arriving here
// is not proof of payment: the status is read from Flow, then the buyer is sent
// to the result page with a 303 so the POST is not replayed.
async function handle(request: NextRequest, token: string | null) {
  let orderId: string | null = null;
  if (token) {
    try {
      orderId = (await syncFlowPayment(token, "return"))?.orderId ?? null;
    } catch (cause) {
      // Flow unreachable: still show the order; its page reconciles again on load.
      console.error("Flow return sync failed", cause);
      const { data } = await createAdminClient().from("orders").select("id").eq("flow_token", token).maybeSingle();
      orderId = data?.id ?? null;
    }
  }
  const target = orderId ? `/compra/${orderId}/` : "/mi-cuenta/";
  return Response.redirect(new URL(target, request.nextUrl.origin), 303);
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  return handle(request, typeof token === "string" ? token : null);
}

export async function GET(request: NextRequest) {
  return handle(request, request.nextUrl.searchParams.get("token"));
}
