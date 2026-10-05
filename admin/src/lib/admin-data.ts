import { createClient } from "@/lib/supabase/client";
import type { ModuleKey, PermissionLevel } from "@/lib/access";

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export const clp = (value: number) => `$${Math.round(value).toLocaleString("es-CL")}`;
export const int = (value: number) => Math.round(value).toLocaleString("es-CL");

/** "+12%" / "−5%" against the previous period, or null when there is no base. */
export function deltaLabel(current: number, previous: number): string | null {
  if (previous <= 0) return current > 0 ? "Nuevo" : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : "−"}${Math.abs(pct)}%`;
}

const dateTime = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Santiago",
});
const dateOnly = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Santiago" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => dateOnly.format(new Date(iso));

export function timeAgo(iso: string, now = Date.now()) {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  return formatDate(iso);
}

export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM so Excel opens accents correctly.
  const blob = new Blob(["﻿" + rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export type Period = "7d" | "30d" | "90d" | "365d";

export const periodOptions: { id: Period; label: string; days: number }[] = [
  { id: "7d", label: "Últimos 7 días", days: 7 },
  { id: "30d", label: "Últimos 30 días", days: 30 },
  { id: "90d", label: "Últimos 90 días", days: 90 },
  { id: "365d", label: "Último año", days: 365 },
];

export type OrderStatus = "pending" | "paid" | "rejected" | "cancelled" | "expired" | "refund_required";
export type OrderKind = "sale" | "cortesia" | "prensa";

export type MetricsOrder = {
  id: string;
  code: string;
  status: OrderStatus;
  kind: OrderKind;
  total: number;
  quantity: number;
  created_at: string;
  paid_at: string | null;
  buyer_name: string | null;
  buyer_email: string;
  event_title: string;
};

export type EventMetric = {
  id: string;
  title: string;
  status: string;
  event_date: string;
  category: string | null;
  capacity: number;
  sold: number;
  tickets: number;
  revenue: number;
};

export type Metrics = {
  revenue: number;
  revenue_prev: number;
  service_fees: number;
  tickets: number;
  tickets_prev: number;
  orders: number;
  orders_prev: number;
  conversion: number | null;
  courtesies: number;
  daily: { day: string; tickets: number; revenue: number }[];
  by_event: EventMetric[];
  by_category: { category: string; tickets: number }[];
  recent_orders: MetricsOrder[];
};

export function rangeFor(period: Period, now = new Date()) {
  const days = periodOptions.find((p) => p.id === period)?.days ?? 30;
  const to = new Date(now.getTime() + 60_000);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));
  return { from, to };
}

export async function fetchMetrics(period: Period, eventId: string | null = null): Promise<Metrics> {
  const { from, to } = rangeFor(period);
  const { data, error } = await createClient().rpc("admin_metrics", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_event_id: eventId,
  });
  if (error) throw error;
  return data as Metrics;
}

/** Paid sales revenue per event since the beginning, or null if the user can't see sales. */
export async function fetchRevenueByEvent(): Promise<Record<string, number> | null> {
  const { data, error } = await createClient().rpc("admin_metrics", {
    p_from: "2000-01-01T00:00:00Z",
    p_to: new Date(Date.now() + 60_000).toISOString(),
    p_event_id: null,
  });
  if (error || !data) return null;
  return Object.fromEntries((data as Metrics).by_event.map((e) => [e.id, e.revenue]));
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  paid: "Pagada",
  pending: "Pendiente",
  rejected: "Rechazada",
  cancelled: "Anulada",
  expired: "Expirada",
  refund_required: "Por reembolsar",
};

export const orderKindLabels: Record<OrderKind, string> = { sale: "Venta", cortesia: "Cortesía", prensa: "Prensa" };

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export type ClientRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  orders_paid: number;
  tickets: number;
  total_spent: number;
  last_purchase_at: string | null;
};

export async function fetchClients(): Promise<ClientRow[]> {
  const { data, error } = await createClient().rpc("admin_clients");
  if (error) throw error;
  return (data ?? []) as ClientRow[];
}

// ---------------------------------------------------------------------------
// Team and roles
// ---------------------------------------------------------------------------

export type StaffRole = {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: Partial<Record<ModuleKey, PermissionLevel>>;
};

export type TeamMember = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "staff";
  staff_role_id: string | null;
  created_at: string;
};

export async function fetchTeam(): Promise<{ members: TeamMember[]; roles: StaffRole[] }> {
  const supabase = createClient();
  const [members, roles] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role, staff_role_id, created_at").in("role", ["admin", "staff"]).order("created_at"),
    supabase.from("staff_roles").select("id, name, description, color, permissions").order("created_at"),
  ]);
  if (members.error) throw members.error;
  if (roles.error) throw roles.error;
  return { members: (members.data ?? []) as TeamMember[], roles: (roles.data ?? []) as StaffRole[] };
}

const memberErrors: Record<string, string> = {
  USER_NOT_FOUND: "No existe una cuenta con ese correo. La persona debe registrarse primero en Passo.",
  ADMIN_ONLY: "Solo un administrador puede otorgar o quitar el nivel de administrador.",
  LAST_ADMIN: "Debe quedar al menos un administrador.",
  ROLE_NOT_FOUND: "Ese rol ya no existe. Recarga la página.",
  FORBIDDEN: "Tu rol no permite administrar el equipo.",
};

export function friendlyError(error: { message?: string; code?: string } | null, fallback: string) {
  const key = Object.keys(memberErrors).find((k) => error?.message?.includes(k));
  if (key) return memberErrors[key];
  if (error?.code === "23505") return "Ya existe un rol con ese nombre.";
  if (error?.code === "23503") return "Este rol todavía tiene miembros. Cámbiales el rol antes de eliminarlo.";
  return fallback;
}

export async function setMember(email: string, role: "admin" | "staff" | "cliente", staffRoleId: string | null) {
  const { error } = await createClient().rpc("admin_set_member", {
    p_email: email,
    p_role: role,
    p_staff_role_id: staffRoleId,
  });
  if (error) throw new Error(friendlyError(error, "No pudimos actualizar el acceso. Inténtalo de nuevo."));
}

export async function saveRole(role: Omit<StaffRole, "id"> & { id?: string }) {
  const supabase = createClient();
  const payload = {
    name: role.name.trim(),
    description: role.description.trim(),
    color: role.color,
    permissions: role.permissions,
    updated_at: new Date().toISOString(),
  };
  const { error } = role.id
    ? await supabase.from("staff_roles").update(payload).eq("id", role.id)
    : await supabase.from("staff_roles").insert(payload);
  if (error) throw new Error(friendlyError(error, "No pudimos guardar el rol. Inténtalo de nuevo."));
}

export async function deleteRole(id: string) {
  const { error } = await createClient().from("staff_roles").delete().eq("id", id);
  if (error) throw new Error(friendlyError(error, "No pudimos eliminar el rol. Inténtalo de nuevo."));
}

// ---------------------------------------------------------------------------
// Courtesies
// ---------------------------------------------------------------------------

export type Courtesy = {
  id: string;
  code: string;
  kind: "cortesia" | "prensa";
  status: OrderStatus;
  buyer_name: string | null;
  buyer_email: string;
  note: string | null;
  created_at: string;
  order_items: { sector_name: string; quantity: number; seat_labels: string[] }[];
};

export async function fetchCourtesies(eventId: string): Promise<Courtesy[]> {
  const { data, error } = await createClient()
    .from("orders")
    .select("id, code, kind, status, buyer_name, buyer_email, note, created_at, order_items(sector_name, quantity, seat_labels)")
    .eq("event_id", eventId)
    .in("kind", ["cortesia", "prensa"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Courtesy[];
}

const courtesyErrors: Record<string, string> = {
  SOLD_OUT: "No queda capacidad suficiente en ese sector.",
  SECTOR_NOT_FOUND: "Ese sector ya no existe. Guarda el evento y recarga la página.",
  RECIPIENT_REQUIRED: "Ingresa el nombre y un correo válido del destinatario.",
  QTY_LIMIT: "Puedes emitir entre 1 y 50 entradas por vez.",
  FORBIDDEN: "Tu rol no permite emitir cortesías.",
  ALREADY_USED: "No se puede anular: al menos una de estas entradas ya fue usada en puerta.",
};

function courtesyError(error: { message?: string } | null, fallback: string) {
  const key = Object.keys(courtesyErrors).find((k) => error?.message?.includes(k));
  return key ? courtesyErrors[key] : fallback;
}

export async function issueCourtesy(input: {
  eventId: string;
  sectorId: string;
  quantity: number;
  kind: "cortesia" | "prensa";
  name: string;
  email: string;
  note: string;
}) {
  const { error } = await createClient().rpc("issue_courtesy", {
    p_event_id: input.eventId,
    p_sector_id: input.sectorId,
    p_quantity: input.quantity,
    p_kind: input.kind,
    p_name: input.name,
    p_email: input.email,
    p_note: input.note,
  });
  if (error) throw new Error(courtesyError(error, "No pudimos emitir las entradas. Inténtalo de nuevo."));
}

export async function voidCourtesy(orderId: string) {
  const { error } = await createClient().rpc("void_courtesy", { p_order_id: orderId });
  if (error) throw new Error(courtesyError(error, "No pudimos anular las entradas. Inténtalo de nuevo."));
}
