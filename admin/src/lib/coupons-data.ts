import { createClient } from "@/lib/supabase/client";

export type CouponKind = "percent" | "amount";

export type Coupon = {
  id: string;
  code: string;
  kind: CouponKind;
  value: number;
  max_uses: number | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
};

export type CouponStats = { paid_uses: number; pending_uses: number; discount_total: number };

export type CouponInput = Omit<Coupon, "id" | "created_at">;

/** Codes are stored in uppercase, letters, digits, "-" and "_" (3 to 30). */
export const normalizeCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30);

export async function listCoupons(eventId: string): Promise<{ coupons: Coupon[]; stats: Record<string, CouponStats> }> {
  const supabase = createClient();
  const [{ data, error }, { data: stats }] = await Promise.all([
    supabase.from("event_coupons").select("id, code, kind, value, max_uses, starts_at, ends_at, active, created_at").eq("event_id", eventId).order("created_at"),
    supabase.rpc("event_coupon_stats", { p_event_id: eventId }),
  ]);
  if (error) throw new Error("No pudimos cargar los cupones de este evento.");
  return {
    coupons: (data ?? []) as Coupon[],
    stats: Object.fromEntries(((stats ?? []) as ({ coupon_id: string } & CouponStats)[]).map((s) => [s.coupon_id, s])),
  };
}

function friendly(message: string) {
  if (message.includes("event_coupons_event_id_code_key") || message.includes("duplicate key")) return "Ya existe un cupón con ese código en este evento.";
  if (message.includes("row-level security") || message.includes("permission")) return "Tu rol no permite editar cupones.";
  if (message.includes("check constraint")) return "Revisa los datos del cupón: código, valor y fechas.";
  return "No pudimos guardar el cupón. Inténtalo de nuevo.";
}

export async function createCoupon(eventId: string, input: CouponInput): Promise<void> {
  const { error } = await createClient().from("event_coupons").insert({ ...input, event_id: eventId });
  if (error) throw new Error(friendly(error.message));
}

export async function updateCoupon(id: string, patch: Partial<CouponInput>): Promise<void> {
  const { error } = await createClient().from("event_coupons").update(patch).eq("id", id);
  if (error) throw new Error(friendly(error.message));
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await createClient().from("event_coupons").delete().eq("id", id);
  if (error) throw new Error(friendly(error.message));
}
