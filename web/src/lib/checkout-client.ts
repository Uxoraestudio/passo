export type CheckoutLine = { sectorId: string; quantity: number; seats?: string[] };

type Failure = { ok: false; error: string; code?: string };

const OFFLINE: Failure = { ok: false, error: "No hay conexión. Revisa tu internet e inténtalo de nuevo." };

async function post(url: string, payload: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => null)) as
    | { orderId?: string; redirectUrl?: string; error?: string; code?: string }
    | null;
  return { response, body };
}

/** Reserves the selection. On success the caller continues to the details step. */
export async function reserveTickets(eventId: string, items: CheckoutLine[]): Promise<{ ok: true; orderId: string } | Failure> {
  try {
    const { response, body } = await post("/api/checkout/", { eventId, items });
    if (!response.ok || !body?.orderId) {
      return { ok: false, error: body?.error ?? "No pudimos reservar tus entradas. Inténtalo de nuevo.", code: body?.code };
    }
    return { ok: true, orderId: body.orderId };
  } catch {
    return OFFLINE;
  }
}

/** Starts the Flow payment for a reserved order and sends the browser there. Resolves only on failure. */
export async function payOrder(orderId: string): Promise<Failure | { ok: true }> {
  try {
    const { response, body } = await post("/api/checkout/pagar/", { orderId });
    if (!response.ok || !body?.redirectUrl) {
      return { ok: false, error: body?.error ?? "No pudimos iniciar el pago. Inténtalo de nuevo.", code: body?.code };
    }
    window.location.assign(body.redirectUrl);
    return { ok: true };
  } catch {
    return OFFLINE;
  }
}
