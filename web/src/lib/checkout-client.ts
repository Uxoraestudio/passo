export type CheckoutLine = { sectorId: string; quantity: number; seats?: string[] };

export type CheckoutResult = { ok: true } | { ok: false; error: string; code?: string };

/** Reserves the selection and sends the browser to Flow. Resolves only on failure. */
export async function startCheckout(eventId: string, items: CheckoutLine[]): Promise<CheckoutResult> {
  try {
    const response = await fetch("/api/checkout/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, items }),
    });
    const body = (await response.json().catch(() => null)) as { redirectUrl?: string; error?: string; code?: string } | null;
    if (!response.ok || !body?.redirectUrl) {
      return { ok: false, error: body?.error ?? "No pudimos iniciar el pago. Inténtalo de nuevo.", code: body?.code };
    }
    window.location.assign(body.redirectUrl);
    return { ok: true };
  } catch {
    return { ok: false, error: "No hay conexión. Revisa tu internet e inténtalo de nuevo." };
  }
}
