"use client";

import { useMemo, useState } from "react";
import styles from "./TicketSelector.module.css";

type Tier = {
  id: string;
  name: string;
  description: string;
  price: number;
  status: "disponible" | "pocas";
};

const tiers: Tier[] = [
  { id: "general-3d", name: "Pase General 3 Días", description: "Acceso total Viernes, Sábado y Domingo", price: 168000, status: "disponible" },
  { id: "vip", name: "Pase Lolla Lounge VIP", description: "Bar abierto, tarimas elevadas y sombra", price: 340000, status: "pocas" },
  { id: "viernes", name: "Pase Diario Viernes", description: "Acceso único 20 de Marzo", price: 68000, status: "disponible" },
  { id: "sabado", name: "Pase Diario Sábado", description: "Acceso único 21 de Marzo", price: 78000, status: "pocas" },
];

const currency = (value: number) => `$${value.toLocaleString("es-CL")} CLP`;

export default function TicketSelector() {
  const [selectedId, setSelectedId] = useState(tiers[0].id);
  const [qty, setQty] = useState(1);

  const selected = tiers.find((t) => t.id === selectedId) ?? tiers[0];
  const subtotal = selected.price * qty;
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;

  const totalLabel = useMemo(() => currency(total), [total]);

  return (
    <section className={styles.card} id="entradas">
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <span className={styles.bracket}>[</span>
            VENTA ACTIVA OFICIAL
            <span className={styles.bracket}>]</span>
          </div>
          <h2 className={styles.title}>Selecciona tus pases</h2>
        </div>
      </div>

      <div className={styles.tiers}>
        {tiers.map((tier) => (
          <label
            key={tier.id}
            className={`${styles.tier} ${selectedId === tier.id ? styles.tierSelected : ""}`}
          >
            <input
              type="radio"
              name="pass_type"
              value={tier.id}
              checked={selectedId === tier.id}
              onChange={() => setSelectedId(tier.id)}
            />
            <div className={styles.tierBody}>
              <div className={styles.tierTop}>
                <span className={styles.tierName}>{tier.name}</span>
                <span className={tier.status === "pocas" ? styles.badgeLow : styles.badgeOk}>
                  {tier.status === "pocas" ? "Pocas un." : "Disponible"}
                </span>
              </div>
              <span className={styles.tierDescription}>{tier.description}</span>
            </div>
            <div className={styles.tierPrice}>
              <span>{currency(tier.price)}</span>
              <small>CLP / pase</small>
            </div>
          </label>
        ))}
      </div>

      <div className={styles.qtyRow}>
        <span>Cantidad de entradas</span>
        <div className={styles.stepper}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Restar entrada">
            −
          </button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Sumar entrada">
            +
          </button>
        </div>
      </div>

      <div className={styles.breakdown}>
        <div>
          <span>Subtotal pases ({qty}x)</span>
          <span>{currency(subtotal)}</span>
        </div>
        <div>
          <span>Cargo por servicio oficial (10%)</span>
          <span>{currency(fee)}</span>
        </div>
        <div>
          <span>Emisión E-Ticket Digital AFORIQ</span>
          <span className={styles.free}>GRATIS ($0 CLP)</span>
        </div>
        <div className={styles.total}>
          <span>Total Final</span>
          <span>{totalLabel}</span>
        </div>
      </div>

      <button type="button" className={styles.cta}>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M5 9V6.5a5 5 0 0110 0V9m-11 0h12a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1z"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Seleccionar entradas · Continuar
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M11.6667 4.16667L17.5 10M17.5 10L11.6667 15.8333M17.5 10H2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <p className={styles.paymentNote}>
        Aceptamos Webpay Plus, Redcompra, Débito y Crédito en hasta 6 cuotas sin interés.
      </p>
    </section>
  );
}
