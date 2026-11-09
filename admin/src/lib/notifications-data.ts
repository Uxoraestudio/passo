import { createClient } from "@/lib/supabase/client";
import { clp } from "@/lib/admin-data";

/**
 * Admin notifications, built from real orders:
 * - sale: a paid ticket purchase.
 * - refund: a payment that arrived after the hold expired (or for seats that
 *   were gone) — someone has to refund it in Flow.
 * - courtesy: a courtesy or press ticket issued from the panel.
 */
export type NotificationType = "sale" | "refund" | "courtesy";
export type NotificationFilter = "all" | NotificationType;

export type AdminNotification = {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  at: string;
  href: string;
};

type OrderRow = {
  id: string;
  code: string;
  status: "paid" | "refund_required";
  kind: "sale" | "cortesia" | "prensa";
  total: number;
  buyer_name: string | null;
  buyer_email: string;
  event_id: string;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
  event: { title: string } | null;
};

function toNotification(o: OrderRow): AdminNotification {
  const event = o.event?.title ?? "Evento";
  const who = o.buyer_name?.trim() || o.buyer_email;
  if (o.status === "refund_required") {
    return {
      id: o.id,
      type: "refund",
      title: `Reembolso pendiente de ${clp(o.total)} · ${event}`,
      detail: `${who} · Orden ${o.code} · Devuélvelo desde Flow`,
      at: o.updated_at,
      href: "/ventas/",
    };
  }
  if (o.kind !== "sale") {
    return {
      id: o.id,
      type: "courtesy",
      title: `${o.kind === "prensa" ? "Acreditación de prensa" : "Cortesía"} emitida · ${event}`,
      detail: `${who} · Orden ${o.code}`,
      at: o.paid_at ?? o.created_at,
      href: `/eventos/${o.event_id}/editar/`,
    };
  }
  return {
    id: o.id,
    type: "sale",
    title: `Venta de ${clp(o.total)} · ${event}`,
    detail: `${who} · Orden ${o.code}`,
    at: o.paid_at ?? o.created_at,
    href: "/ventas/",
  };
}

export async function fetchNotifications({
  filter = "all",
  offset = 0,
  limit = 20,
}: { filter?: NotificationFilter; offset?: number; limit?: number } = {}): Promise<AdminNotification[]> {
  let query = createClient()
    .from("orders")
    .select("id, code, status, kind, total, buyer_name, buyer_email, event_id, created_at, paid_at, updated_at, event:events(title)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === "sale") query = query.eq("status", "paid").eq("kind", "sale");
  else if (filter === "refund") query = query.eq("status", "refund_required");
  else if (filter === "courtesy") query = query.eq("status", "paid").in("kind", ["cortesia", "prensa"]);
  else query = query.in("status", ["paid", "refund_required"]);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as OrderRow[]).map(toNotification);
}

// ---------------------------------------------------------------------------
// "Seen" marker, per browser. The bell and the page share it, and the page
// tells the bell when it marks everything as seen.
// ---------------------------------------------------------------------------

const SEEN_KEY = "aforiq-admin:notifications-seen-at";
const SEEN_EVENT = "aforiq:notifications-seen";

export function readSeenAt(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function markSeen(upTo: number) {
  if (upTo <= readSeenAt()) return;
  try {
    localStorage.setItem(SEEN_KEY, String(upTo));
  } catch {
    // Private mode: unread counts just won't be remembered.
  }
  window.dispatchEvent(new CustomEvent(SEEN_EVENT, { detail: upTo }));
}

export function onSeen(callback: (seenAt: number) => void) {
  const handler = (e: Event) => callback((e as CustomEvent<number>).detail);
  window.addEventListener(SEEN_EVENT, handler);
  return () => window.removeEventListener(SEEN_EVENT, handler);
}

/** Courtesies open the event, which needs the Eventos module; otherwise fall back to Ventas. */
export const hrefFor = (n: AdminNotification, canSeeEvents: boolean) => (n.type === "courtesy" && !canSeeEvents ? "/ventas/" : n.href);

export const newestAt =(items: AdminNotification[]) => items.reduce((max, n) => Math.max(max, new Date(n.at).getTime()), 0);
