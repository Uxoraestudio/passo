import { syncFlowPayment } from "@/lib/payments";

// Server-to-server notification from Flow (application/x-www-form-urlencoded, field "token").
// The token alone proves nothing: syncFlowPayment asks Flow for the signed status.
// A non-2xx response makes Flow retry, so errors are surfaced as 500.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  if (typeof token !== "string" || !token) {
    return new Response("missing token", { status: 400 });
  }

  try {
    await syncFlowPayment(token, "confirmation");
    return new Response("OK", { status: 200 });
  } catch (cause) {
    console.error("Flow confirmation failed", cause);
    return new Response("error", { status: 500 });
  }
}
