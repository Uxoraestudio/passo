"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EventCardData } from "@/lib/events";
import type { EventDetail, TicketTier } from "@/lib/eventDetails";
import { generateSeatMap } from "@/lib/seatMap";
import styles from "@/app/eventos/[slug]/asientos/page.module.css";

const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;
const RESERVATION_SECONDS = 10 * 60;

const steps = [{ label: "Entradas" }, { label: "Tus datos" }, { label: "Confirmación" }, { label: "Pago" }];

export default function AsientosClient({
  event,
  detail,
  slug,
  tier,
  qty,
}: {
  event: EventCardData;
  detail: EventDetail;
  slug: string;
  tier: TicketTier;
  qty: number;
}) {
  const router = useRouter();
  const rows = useMemo(() => generateSeatMap(tier.id), [tier.id]);
  const [selected, setSelected] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(RESERVATION_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const toggleSeat = (seatId: string, status: string) => {
    if (status === "occupied") return;
    setSelected((prev) => {
      if (prev.includes(seatId)) return prev.filter((s) => s !== seatId);
      if (prev.length >= qty) return prev;
      return [...prev, seatId];
    });
  };

  const subtotal = tier.price * selected.length;
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;
  const canContinue = selected.length === qty;

  return (
    <main className={styles.main}>
      <div className={styles.stepsBar}>
        <div className={styles.steps}>
          {steps.map((step, index) => (
            <div key={step.label} className={styles.step} data-active={index === 0}>
              <span className={styles.stepNumber}>{index + 1}</span>
              {step.label}
              {index < steps.length - 1 && <span className={styles.stepLine} />}
            </div>
          ))}
        </div>
        <div className={styles.timer}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tu selección se guarda por: {minutes}:{seconds}
        </div>
      </div>

      <div className={styles.eventRow}>
        <div className={styles.eventInfo}>
          <div className={styles.eventThumb}>
            <Image src={event.image} alt={event.alt} fill sizes="56px" className={styles.eventImage} />
          </div>
          <div>
            <p className={styles.eventName}>
              {event.title} · {event.subtitle}
            </p>
            <p className={styles.eventMeta}>
              {detail.dateLabel} · {detail.doorsOpen} · {event.venue}, {event.city}
            </p>
          </div>
        </div>
        <Link href={`/eventos/${slug}/entradas`} className={styles.changeSectorLink}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cambiar sector
        </Link>
      </div>

      <div className={styles.layout}>
        <section className={styles.mapCard}>
          <div className={styles.sectorHeader}>
            <span className={styles.sectorDot} style={{ background: tier.color }} />
            <div>
              <h1>{tier.name}</h1>
              <p>
                Selecciona {qty} asiento{qty > 1 ? "s" : ""} · Vista frontal hacia el escenario
              </p>
            </div>
          </div>

          <div className={styles.mapScroll}>
            <div className={styles.stageBar}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 15a4 4 0 004-4V7a4 4 0 10-8 0v4a4 4 0 004 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M6 11a6 6 0 0012 0M12 19v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              ESCENARIO
            </div>
            <div className={styles.grid} style={{ transform: `scale(${zoom})` }}>
              {rows.map((row) => (
                <div key={row[0].row} className={styles.row}>
                  <span className={styles.rowLabel}>{row[0].row}</span>
                  {row.map((seat) => {
                    const isSelected = selected.includes(seat.id);
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        className={styles.seat}
                        data-status={isSelected ? "selected" : seat.status}
                        disabled={seat.status === "occupied"}
                        onClick={() => toggleSeat(seat.id, seat.status)}
                        aria-label={`Asiento ${seat.id}, ${isSelected ? "seleccionado" : seat.status}`}
                        aria-pressed={isSelected}
                      >
                        {seat.status === "accessible" ? (
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="4" r="1.6" fill="currentColor" />
                            <path
                              d="M12 7v4l4 2m-4-2-3 6m3-6H8"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : isSelected ? (
                          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M16.667 5 7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          seat.number
                        )}
                      </button>
                    );
                  })}
                  <span className={styles.rowLabel}>{row[0].row}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.mapFooter}>
            <div className={styles.zoomControls}>
              <button type="button" onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))} aria-label="Alejar">
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))} aria-label="Acercar">
                +
              </button>
              <button type="button" className={styles.centerButton} onClick={() => setZoom(1)}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 9V5a1 1 0 011-1h4M20 9V5a1 1 0 00-1-1h-4M4 15v4a1 1 0 001 1h4m11-5v4a1 1 0 01-1 1h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Centrar
              </button>
            </div>
            <div className={styles.seatLegend}>
              <span>
                <i className={styles.legendAvailable} />
                Disponible
              </span>
              <span>
                <i className={styles.legendSelected} />
                Seleccionado ({selected.length})
              </span>
              <span>
                <i className={styles.legendOccupied} />
                Ocupado
              </span>
              <span>
                <i className={styles.legendAccessible} />
                Accesible
              </span>
            </div>
          </div>
        </section>

        <aside className={styles.summary}>
          <div className={styles.summaryHeader}>
            <h2>Tu selección</h2>
            <span className={styles.summaryCount}>
              {selected.length} asiento{selected.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className={styles.summaryHint}>Revisa tus asientos antes de continuar.</p>

          {selected.length === 0 ? (
            <p className={styles.emptySummary}>
              Selecciona {qty} asiento{qty > 1 ? "s" : ""} en el mapa para continuar.
            </p>
          ) : (
            <div className={styles.selectionList}>
              {selected.map((seatId, index) => (
                <div key={seatId} className={styles.selectionItem}>
                  <span className={styles.selectionIndex}>{index + 1}</span>
                  <div className={styles.selectionInfo}>
                    <p>
                      Entrada {index + 1} <span>{tier.name}</span>
                    </p>
                    <span>
                      Fila {seatId[0]} · Asiento {seatId.slice(1)}
                    </span>
                  </div>
                  <span className={styles.selectionPrice}>{currency(tier.price)}</span>
                  <button type="button" onClick={() => toggleSeat(seatId, "available")} aria-label={`Quitar asiento ${seatId}`}>
                    × Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.summaryBreakdown}>
            <div>
              <span>Subtotal ({selected.length} entradas)</span>
              <span>{currency(subtotal)}</span>
            </div>
            <div>
              <span>Cargo por servicio (10%)</span>
              <span>{currency(fee)}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <strong>{currency(total)}</strong>
            </div>
            <small>Impuestos incluidos</small>
          </div>

          <button
            type="button"
            className={styles.continueButton}
            disabled={!canContinue}
            onClick={() => router.push(`/proximamente?title=${encodeURIComponent("Datos del comprador")}`)}
          >
            Continuar a datos del comprador
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M11.6667 4.16667L17.5 10M17.5 10L11.6667 15.8333M17.5 10H2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <Link href={`/eventos/${slug}/entradas`} className={styles.changeSectorLinkSmall}>
            ← Cambiar de sector
          </Link>

          <div className={styles.reservedNote}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <div>
              <p>Tus asientos están reservados temporalmente.</p>
              <span>Finaliza tu compra dentro del tiempo restante para garantizar tu lugar.</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
