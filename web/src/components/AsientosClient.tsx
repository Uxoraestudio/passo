"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EventCardData } from "@/lib/events";
import type { EventDetail } from "@/lib/eventDetails";
import type { SaleTier } from "@/lib/event-sale";
import { buildSeatRows, parseSeatLabel } from "@/lib/seatMap";
import { reserveTickets } from "@/lib/checkout-client";
import styles from "@/app/eventos/[slug]/asientos/page.module.css";

const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;
const HOLD_MINUTES = 15;
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 1.4;

const steps = ["Entradas", "Tus datos", "Confirmación", "Pago"];

const stroke = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M11.6667 4.16667L17.5 10M17.5 10L11.6667 15.8333M17.5 10H2.5" {...stroke} />
    </svg>
  );
}

export default function AsientosClient({
  event,
  eventId,
  detail,
  slug,
  tier,
  qty,
  takenSeats,
}: {
  event: EventCardData;
  eventId: string;
  detail: EventDetail;
  slug: string;
  tier: SaleTier;
  qty: number;
  takenSeats: string[];
}) {
  const router = useRouter();
  const rows = useMemo(
    () => buildSeatRows(tier.capacity, tier.seatsPerRow, new Set(takenSeats)),
    [tier.capacity, tier.seatsPerRow, takenSeats]
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const mapScrollRef = useRef<HTMLDivElement>(null);

  // Wide sectors overflow on phones; keep the stage and centre seats in view.
  useEffect(() => {
    const el = mapScrollRef.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [zoom]);

  const handleCheckout = async () => {
    if (selected.length !== qty || submitting) return;
    setSubmitting(true);
    setCheckoutError("");
    const result = await reserveTickets(eventId, [{ sectorId: tier.id, quantity: qty, seats: selected }]);
    if (!result.ok) {
      setCheckoutError(result.error);
      setSubmitting(false);
      if (result.code === "SEAT_TAKEN") {
        setSelected([]);
        router.refresh();
      }
      return;
    }
    router.push(`/compra/${result.orderId}/datos/`);
  };

  const toggleSeat = (seatId: string, status: string) => {
    if (status === "occupied" || submitting) return;
    setCheckoutError("");
    setSelected((prev) => {
      if (prev.includes(seatId)) return prev.filter((s) => s !== seatId);
      if (prev.length >= qty) return qty === 1 ? [seatId] : prev;
      return [...prev, seatId];
    });
  };

  const subtotal = tier.price * selected.length;
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;
  const canContinue = selected.length === qty;
  const remaining = qty - selected.length;
  const seatWord = (n: number) => `asiento${n === 1 ? "" : "s"}`;
  const continueLabel = submitting
    ? "Reservando tus asientos…"
    : canContinue
      ? "Continuar"
      : `Elige ${remaining} ${seatWord(remaining)} más`;

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <ol className={styles.steps} aria-label="Pasos de la compra">
          {steps.map((step, index) => (
            <li key={step} className={styles.step} data-active={index === 0} aria-current={index === 0 ? "step" : undefined}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.stepLabel}>
                {index + 1}. {step}
              </span>
            </li>
          ))}
        </ol>
        <p className={styles.holdPill}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" {...stroke} />
            <path d="M12 7v5l3 2" {...stroke} />
          </svg>
          Al continuar guardamos tus asientos por <strong>{HOLD_MINUTES} min</strong>
        </p>
      </div>

      <header className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>Selecciona tus asientos</h1>
          <span className={styles.stepChip}>Paso 1.1</span>
        </div>
        <p className={styles.pageSubtitle}>Elige los mejores lugares y vive una experiencia inolvidable.</p>
      </header>

      <section className={styles.eventCard} aria-label="Evento">
        <div className={styles.eventThumb}>
          <Image src={event.image} alt={event.alt} fill sizes="72px" className={styles.eventImage} />
        </div>
        <div className={styles.eventInfo}>
          <p className={styles.eventName}>
            {event.title}
            {event.subtitle && <span> · {event.subtitle}</span>}
          </p>
          <div className={styles.eventMeta}>
            <span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15" rx="2.5" {...stroke} />
                <path d="M3.5 10h17M8 3v4M16 3v4" {...stroke} />
              </svg>
              {detail.dateSub} {detail.dateLabel} · {detail.doorsOpen}
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" {...stroke} />
                <circle cx="12" cy="10" r="2.5" {...stroke} />
              </svg>
              {event.venue}, {event.city}
            </span>
          </div>
        </div>
        <Link href={`/eventos/${slug}/entradas/`} className={styles.changeSectorButton}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M8.3 4.2 2.5 10m0 0 5.8 5.8M2.5 10h15" {...stroke} />
          </svg>
          Cambiar sector
        </Link>
      </section>

      <div className={styles.layout}>
        <section className={styles.mapCard} aria-labelledby="sector-title">
          <div className={styles.sectorHeader}>
            <div className={styles.sectorTitleBlock}>
              <h2 id="sector-title" className={styles.sectorTitle}>
                <span className={styles.sectorDot} style={{ background: tier.color }} aria-hidden="true" />
                {tier.name}
              </h2>
              <p className={styles.sectorSubtitle}>
                Selecciona {qty} {seatWord(qty)} · Vista frontal al escenario
              </p>
            </div>
            <span className={styles.numberedChip}>Asignación numerada</span>
          </div>

          <div className={styles.mapScroll} ref={mapScrollRef}>
            <div className={styles.mapCanvas} style={{ zoom }}>
              <div className={styles.stage} aria-hidden="true">
                <div className={styles.stageShape}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 15a4 4 0 0 0 4-4V7a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4Z" {...stroke} />
                    <path d="M6 11a6 6 0 0 0 12 0M12 19v2" {...stroke} />
                  </svg>
                  Escenario
                </div>
                <span className={styles.stageGlow} />
                <span className={styles.stageCaption}>Frente al escenario</span>
              </div>

              <div className={styles.grid} role="group" aria-label={`Asientos de ${tier.name}`}>
                {rows.map((row) => (
                  <div key={row[0].row} className={styles.row}>
                    <span className={styles.rowLabel} aria-hidden="true">
                      {row[0].row}
                    </span>
                    {row.map((seat) => {
                      const isSelected = selected.includes(seat.id);
                      const state = isSelected ? "selected" : seat.status;
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          className={styles.seat}
                          data-status={state}
                          disabled={seat.status === "occupied"}
                          onClick={() => toggleSeat(seat.id, seat.status)}
                          aria-label={`Fila ${seat.row}, asiento ${seat.number}, ${
                            isSelected ? "seleccionado" : seat.status === "occupied" ? "ocupado" : "disponible"
                          }`}
                          aria-pressed={isSelected}
                        >
                          {isSelected ? (
                            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                              <path d="M16.667 5 7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            seat.number
                          )}
                        </button>
                      );
                    })}
                    <span className={styles.rowLabel} aria-hidden="true">
                      {row[0].row}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.mapFooter}>
            <div className={styles.zoomControls}>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - 0.1).toFixed(1)))}
                disabled={zoom <= ZOOM_MIN}
                aria-label="Alejar"
              >
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3.5 8h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <span aria-live="polite">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + 0.1).toFixed(1)))}
                disabled={zoom >= ZOOM_MAX}
                aria-label="Acercar"
              >
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3.5 8h9M8 3.5v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <span className={styles.zoomDivider} aria-hidden="true" />
              <button type="button" className={styles.centerButton} onClick={() => setZoom(1)}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4m11-5v4a1 1 0 0 1-1 1h-4" {...stroke} />
                </svg>
                Centrar
              </button>
            </div>
            <ul className={styles.legend} aria-label="Leyenda">
              <li>
                <i data-status="available" aria-hidden="true" />
                Disponible
              </li>
              <li>
                <i data-status="selected" aria-hidden="true" />
                Seleccionado ({selected.length})
              </li>
              <li>
                <i data-status="occupied" aria-hidden="true" />
                Ocupado
              </li>
            </ul>
          </div>
        </section>

        <aside className={styles.sidebar}>
          <section className={styles.summary} aria-labelledby="summary-title">
            <div className={styles.summaryHeader}>
              <div>
                <h2 id="summary-title" className={styles.summaryTitle}>
                  Tu selección
                </h2>
                <p className={styles.summaryHint}>Revisa tus asientos antes de continuar</p>
              </div>
              <span className={styles.summaryCount}>
                {selected.length}/{qty} {seatWord(qty)}
              </span>
            </div>

            {selected.length === 0 ? (
              <p className={styles.emptySummary}>
                Toca {qty === 1 ? "un asiento disponible" : `${qty} asientos disponibles`} en el mapa para agregarlos aquí.
              </p>
            ) : (
              <ol className={styles.selectionList}>
                {selected.map((seatId, index) => {
                  const seat = parseSeatLabel(seatId);
                  return (
                    <li key={seatId} className={styles.selectionItem}>
                      <span className={styles.selectionIndex}>{index + 1}</span>
                      <div className={styles.selectionInfo}>
                        <p className={styles.selectionName}>
                          Entrada {index + 1}
                          <span className={styles.selectionTier}>{tier.name}</span>
                        </p>
                        <p className={styles.selectionSeat}>
                          Fila {seat.row} · Asiento {seat.number}
                        </p>
                      </div>
                      <div className={styles.selectionAside}>
                        <span className={styles.selectionPrice}>{currency(tier.price)}</span>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => toggleSeat(seatId, "available")}
                          aria-label={`Quitar fila ${seat.row}, asiento ${seat.number}`}
                        >
                          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="m4.5 4.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                          Quitar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className={styles.breakdown}>
              <div>
                <span>
                  Subtotal ({selected.length} {selected.length === 1 ? "entrada" : "entradas"})
                </span>
                <span>{currency(subtotal)}</span>
              </div>
              <div>
                <span>Cargo por servicio (10%)</span>
                <span>{currency(fee)}</span>
              </div>
              <div className={styles.total}>
                <span>Total</span>
                <strong>{currency(total)} CLP</strong>
              </div>
              <small>Impuestos incluidos</small>
            </div>

            {checkoutError && (
              <p className={styles.checkoutError} role="alert">
                {checkoutError}
              </p>
            )}

            <button
              type="button"
              className={styles.continueButton}
              disabled={!canContinue || submitting}
              aria-busy={submitting}
              onClick={handleCheckout}
            >
              {continueLabel}
              {canContinue && !submitting && <ArrowIcon />}
            </button>

            <Link href={`/eventos/${slug}/entradas/`} className={styles.changeSectorLink}>
              ← Cambiar de sector
            </Link>

            <div className={styles.reservedNote}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" {...stroke} />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" {...stroke} />
              </svg>
              <div>
                <p>Tus asientos se reservan al continuar.</p>
                <span>
                  Quedan bloqueados para ti por {HOLD_MINUTES} minutos mientras completas tus datos y el pago seguro en Flow.
                </span>
              </div>
            </div>
          </section>

          <div className={styles.guarantee}>
            <span className={styles.guaranteeIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" {...stroke} />
                <path d="m9 12 2 2 4-4" {...stroke} />
              </svg>
            </span>
            <div>
              <p>Compra oficial y segura</p>
              <span>Tus entradas se emiten directamente en tu cuenta Passo.</span>
            </div>
          </div>
        </aside>
      </div>

      <div className={styles.mobileBar}>
        <div>
          <span className={styles.mobileBarLabel}>
            {selected.length}/{qty} {seatWord(qty)}
          </span>
          <strong className={styles.mobileBarTotal}>{currency(total)}</strong>
        </div>
        <button
          type="button"
          className={styles.continueButton}
          disabled={!canContinue || submitting}
          aria-busy={submitting}
          onClick={handleCheckout}
        >
          {continueLabel}
          {canContinue && !submitting && <ArrowIcon />}
        </button>
      </div>
    </main>
  );
}
