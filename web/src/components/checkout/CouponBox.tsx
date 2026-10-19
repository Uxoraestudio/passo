"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { currency } from "./OrderSummary";
import styles from "./Checkout.module.css";

const ERRORS: Record<string, string> = {
  COUPON_NOT_FOUND: "Ese código no existe para este evento. Revisa que esté bien escrito.",
  COUPON_INACTIVE: "Ese cupón no está vigente.",
  COUPON_USED_UP: "Ese cupón ya alcanzó su límite de usos.",
  COUPON_TOO_LARGE: "Ese cupón no se puede usar en esta compra.",
  ORDER_EXPIRED: "Tu reserva venció. Vuelve a elegir tus entradas.",
  PAYMENT_ALREADY_STARTED: "Ya iniciaste el pago de esta compra.",
};

/** "¿Tienes un cupón?": applies or removes a discount code on the pending order. */
export default function CouponBox({ orderId, code, discount, disabled }: { orderId: string; code: string | null; discount: number; disabled: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const apply = async (next: string) => {
    setBusy(true);
    setError("");
    const { error: rpcError } = await createClient().rpc("apply_order_coupon", { p_order_id: orderId, p_code: next });
    setBusy(false);
    if (rpcError) {
      const key = Object.keys(ERRORS).find((k) => rpcError.message.includes(k));
      setError(key ? ERRORS[key] : "No pudimos aplicar el cupón. Inténtalo de nuevo.");
      return;
    }
    setValue("");
    setOpen(false);
    router.refresh();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (value.trim() && !busy) apply(value.trim());
  };

  if (code) {
    return (
      <div className={styles.couponApplied}>
        <span>
          <strong>{code}</strong> aplicado · ahorras {currency(discount)}
        </span>
        <button type="button" onClick={() => apply("")} disabled={busy || disabled}>
          {busy ? "Quitando…" : "Quitar"}
        </button>
        {error && (
          <p className={styles.couponError} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className={styles.couponToggle} onClick={() => setOpen(true)} disabled={disabled}>
        ¿Tienes un cupón de descuento?
      </button>
    );
  }

  return (
    <form className={styles.couponForm} onSubmit={submit}>
      <label htmlFor="coupon-code" className={styles.srOnly}>
        Código del cupón
      </label>
      <div className={styles.couponRow}>
        <input
          id="coupon-code"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="Código del cupón"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={30}
          autoFocus
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "coupon-error" : undefined}
        />
        <button type="submit" disabled={busy || !value.trim() || disabled}>
          {busy ? "Aplicando…" : "Aplicar"}
        </button>
      </div>
      {error && (
        <p id="coupon-error" className={styles.couponError} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
