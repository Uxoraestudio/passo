"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AccountTicket } from "@/lib/account-tickets";
import DynamicQr from "./DynamicQr";
import styles from "./MyTickets.module.css";

export type TicketView = "proximas" | "pasadas" | "canceladas";

const stroke = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="12" rx="2" {...stroke} />
      <path d="M3 8.5h14M7 3v3M13 3v3" {...stroke} />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" {...stroke} />
      <path d="M10 6.5V10l2.5 1.5" {...stroke} />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 17.5s5.5-4.6 5.5-9a5.5 5.5 0 1 0-11 0c0 4.4 5.5 9 5.5 9Z" {...stroke} />
      <circle cx="10" cy="8.5" r="2" {...stroke} />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5V8a2 2 0 0 0 0 4v1.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 13.5V12a2 2 0 0 0 0-4V6.5Z" {...stroke} />
    </svg>
  );
}

function entriesLabel(quantity: number) {
  return `${quantity} ${quantity === 1 ? "entrada" : "entradas"}`;
}

function seatLine(ticket: AccountTicket) {
  return ticket.seats ? `${ticket.sector} · ${ticket.seats}` : ticket.sector;
}

function mapsUrl(ticket: AccountTicket) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ticket.event.venue}, ${ticket.event.city}, Chile`)}`;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        <TicketIcon />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link href="/eventos" className={styles.emptyAction}>
        Explorar eventos
      </Link>
    </div>
  );
}

function CompactTicket({ ticket, onOpen }: { ticket: AccountTicket; onOpen?: () => void }) {
  const used = ticket.status === "usada";
  return (
    <article className={styles.compact} data-used={used}>
      <div className={styles.compactThumb}>
        <Image src={ticket.event.image} alt="" fill sizes="(max-width: 640px) 120px, 144px" className={styles.cover} />
        <span className={styles.dateBadge}>
          <strong>{ticket.event.day}</strong>
          {ticket.event.month}
        </span>
      </div>
      <div className={styles.compactBody}>
        <h3 className={styles.compactTitle}>{ticket.event.title}</h3>
        {ticket.event.subtitle && <p className={styles.compactSubtitle}>{ticket.event.subtitle}</p>}
        <ul className={styles.metaList} data-size="sm">
          <li>
            <CalendarIcon />
            {ticket.event.dateLong}
            <span className={styles.metaGap} />
            <ClockIcon />
            {ticket.event.time}
          </li>
          <li>
            <PinIcon />
            {ticket.event.venue}, {ticket.event.city}
          </li>
        </ul>
        <div className={styles.compactFooter}>
          <div>
            <p className={styles.compactCount}>{entriesLabel(ticket.quantity)}</p>
            <p className={styles.compactSeat}>{seatLine(ticket)}</p>
          </div>
          {used ? (
            <Link href={`/eventos/${ticket.event.slug}`} className={styles.secondaryButton}>
              Ver evento
            </Link>
          ) : (
            <button type="button" className={styles.smallPrimary} onClick={onOpen}>
              Ver entradas
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MyTickets({ tickets, view }: { tickets: AccountTicket[]; view: TicketView }) {
  const upcoming = tickets.filter((t) => t.status === "confirmada");
  const past = tickets.filter((t) => t.status === "usada");
  const cancelled = tickets.filter((t) => t.status === "cancelada");

  const [selectedId, setSelectedId] = useState(upcoming[0]?.id ?? null);
  const [showQr, setShowQr] = useState(false);
  const [entry, setEntry] = useState(0);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const featuredRef = useRef<HTMLElement>(null);

  if (view === "pasadas") {
    return past.length ? (
      <div className={styles.stack}>
        <div className={styles.grid}>
          {past.map((ticket) => (
            <CompactTicket key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </div>
    ) : (
      <EmptyState title="Aún no tienes eventos pasados" text="Cuando asistas a un evento, quedará guardado aquí como recuerdo de tu experiencia." />
    );
  }

  if (view === "canceladas") {
    return cancelled.length ? (
      <div className={styles.grid}>
        {cancelled.map((ticket) => (
          <CompactTicket key={ticket.id} ticket={ticket} />
        ))}
      </div>
    ) : (
      <EmptyState
        title="No tienes entradas canceladas"
        text="Si un evento se cancela o se reprograma, aquí verás el estado de tu devolución."
      />
    );
  }

  const featured = upcoming.find((t) => t.id === selectedId) ?? upcoming[0];

  if (!featured) {
    return <EmptyState title="Todavía no tienes entradas" text="Cuando compres tus entradas, aparecerán aquí listas para mostrar en el acceso." />;
  }

  const others = upcoming.filter((t) => t.id !== featured.id);

  const openTicket = (id: string) => {
    setSelectedId(id);
    setEntry(0);
    setShowQr(true);
    featuredRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const download = () => {
    setShowQr(true);
    window.setTimeout(() => window.print(), 120);
  };

  const share = async () => {
    const url = `${window.location.origin}/eventos/${featured.event.slug}/`;
    try {
      if (navigator.share) {
        await navigator.share({ title: featured.event.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareStatus("Enlace copiado");
    } catch {
      setShareStatus(null);
      return;
    }
    window.setTimeout(() => setShareStatus(null), 2400);
  };

  const days = featured.event.daysLeft;

  return (
    <div className={styles.stack}>
      <article ref={featuredRef} className={styles.featured} data-qr={showQr} aria-label={`Entradas para ${featured.event.title}`}>
        <div className={styles.featuredMedia}>
          <div className={styles.poster} aria-hidden={showQr}>
            <Image src={featured.event.image} alt={featured.event.title} fill priority sizes="(max-width: 1024px) 100vw, 420px" className={styles.cover} />
            <span className={styles.dateBadge} data-size="lg">
              <strong>{featured.event.day}</strong>
              {featured.event.month}
            </span>
          </div>

          {showQr && (
            <div className={styles.ticketPanel}>
              <p className={styles.ticketPanelTop}>
                <span>Entrada {entry + 1} de {featured.quantity}</span>
                <span className={styles.demoTag}>QR provisional</span>
              </p>
              <DynamicQr seed={`${featured.orderCode}-${entry}`} label={`Código QR de la entrada ${entry + 1} para ${featured.event.title}`} />
              <p className={styles.ticketPanelSeat}>{seatLine(featured)}</p>
              <p className={styles.ticketPanelOrder}>Orden {featured.orderCode}</p>
              {featured.quantity > 1 && (
                <div className={styles.entrySwitch}>
                  <button type="button" onClick={() => setEntry((e) => Math.max(0, e - 1))} disabled={entry === 0} aria-label="Entrada anterior">
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m12 5-5 5 5 5" {...stroke} />
                    </svg>
                  </button>
                  <span aria-hidden="true">
                    {Array.from({ length: featured.quantity }, (_, i) => (
                      <i key={i} data-active={i === entry} />
                    ))}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEntry((e) => Math.min(featured.quantity - 1, e + 1))}
                    disabled={entry === featured.quantity - 1}
                    aria-label="Entrada siguiente"
                  >
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="m8 5 5 5-5 5" {...stroke} />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.featuredBody}>
          <div className={styles.featuredHead}>
            <div>
              <h2 className={styles.featuredTitle}>{featured.event.title}</h2>
              {featured.event.subtitle && <p className={styles.featuredSubtitle}>{featured.event.subtitle}</p>}
            </div>
            <span className={styles.statusPill}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="7" fill="currentColor" />
                <path d="m5 8.2 2 2 4-4.2" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Confirmada
            </span>
          </div>

          <ul className={styles.metaList}>
            <li>
              <CalendarIcon />
              {featured.event.dateLong}
              <span className={styles.metaGap} />
              <ClockIcon />
              {featured.event.time}
            </li>
            <li>
              <PinIcon />
              {featured.event.venue}, {featured.event.city}
            </li>
          </ul>

          <div className={styles.entriesRow}>
            <div>
              <p className={styles.entriesLabel}>Tus entradas</p>
              <p className={styles.entriesSeat}>{seatLine(featured)}</p>
              <p className={styles.entriesCount}>{entriesLabel(featured.quantity)}</p>
            </div>
            <div className={styles.countdown}>
              <CalendarIcon />
              <div>
                <strong>{days === 0 ? "¡Es hoy!" : days === 1 ? "Falta 1 día" : `Faltan ${days} días`}</strong>
                <span>¡Nos vemos pronto!</span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.primaryButton} onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
              <TicketIcon />
              {showQr ? "Ocultar entradas" : "Ver entradas"}
            </button>
            <button type="button" className={styles.outlineButton} onClick={download}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 3.5v9m0 0-3.5-3.5M10 12.5l3.5-3.5M4 15.5h12" {...stroke} />
              </svg>
              Descargar
            </button>
            <button type="button" className={styles.ghostButton} disabled title="Disponible próximamente">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="14" height="10" rx="2" {...stroke} />
                <path d="M3 8.5h14" {...stroke} />
              </svg>
              Agregar a Wallet
              <small>Pronto</small>
            </button>
            <button type="button" className={styles.ghostButton} onClick={share}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="5.5" cy="10" r="2" {...stroke} />
                <circle cx="14.5" cy="5" r="2" {...stroke} />
                <circle cx="14.5" cy="15" r="2" {...stroke} />
                <path d="m7.3 9 5.4-3M7.3 11l5.4 3" {...stroke} />
              </svg>
              {shareStatus ?? "Compartir"}
            </button>
            <a href={mapsUrl(featured)} target="_blank" rel="noopener noreferrer" className={styles.ghostButton}>
              <PinIcon />
              Cómo llegar
            </a>
          </div>
        </div>
      </article>

      {others.length > 0 && (
        <section className={styles.upcoming} aria-labelledby="proximas-experiencias">
          <h2 id="proximas-experiencias" className={styles.sectionTitle}>
            Próximas experiencias
          </h2>
          <p className={styles.sectionSubtitle}>Más eventos que vivirás pronto.</p>
          <div className={styles.grid}>
            {others.map((ticket) => (
              <CompactTicket key={ticket.id} ticket={ticket} onOpen={() => openTicket(ticket.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
