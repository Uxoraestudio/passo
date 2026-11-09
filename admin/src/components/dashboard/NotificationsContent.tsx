"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/icons";
import { SkeletonList } from "@/components/Skeleton";
import { allows, useAccess } from "@/lib/access";
import { formatDateTime, timeAgo } from "@/lib/admin-data";
import {
  fetchNotifications,
  hrefFor,
  markSeen,
  newestAt,
  readSeenAt,
  type AdminNotification,
  type NotificationFilter,
  type NotificationType,
} from "@/lib/notifications-data";
import pageStyles from "@/app/inicio/page.module.css";
import styles from "./NotificationsContent.module.css";

const PAGE = 20;

const filters: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "sale", label: "Ventas" },
  { id: "refund", label: "Reembolsos pendientes" },
  { id: "courtesy", label: "Cortesías y prensa" },
];

const typeIcon: Record<NotificationType, string> = {
  sale: "payments",
  refund: "currency_exchange",
  courtesy: "redeem",
};

const emptyText: Record<NotificationFilter, string> = {
  all: "Todavía no hay notificaciones. Aquí verás cada venta, reembolso y cortesía.",
  sale: "Todavía no hay ventas pagadas.",
  refund: "No hay reembolsos pendientes.",
  courtesy: "No se han emitido cortesías ni acreditaciones.",
};

export default function NotificationsContent() {
  const canSeeEvents = allows(useAccess(), "eventos");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [items, setItems] = useState<AdminNotification[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  // What was unseen when the page opened stays marked while you read it.
  const [markFrom] = useState(readSeenAt);

  useEffect(() => {
    let active = true;
    fetchNotifications({ filter, limit: PAGE })
      .then((rows) => {
        if (!active) return;
        setError("");
        setItems(rows);
        setHasMore(rows.length === PAGE);
        if (filter === "all") markSeen(newestAt(rows));
      })
      .catch(() => active && setError("No pudimos cargar las notificaciones. Revisa tu conexión e inténtalo de nuevo."));
    return () => {
      active = false;
    };
  }, [filter, reload]);

  const changeFilter = (next: NotificationFilter) => {
    if (next === filter) return;
    setItems(null);
    setError("");
    setFilter(next);
  };

  const loadMore = async () => {
    if (!items) return;
    setLoadingMore(true);
    try {
      const rows = await fetchNotifications({ filter, offset: items.length, limit: PAGE });
      setItems([...items, ...rows]);
      setHasMore(rows.length === PAGE);
    } catch {
      setError("No pudimos cargar más notificaciones.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className={pageStyles.main}>
      <div className={pageStyles.heroRow}>
        <div>
          <h1 className={pageStyles.pageTitle}>Notificaciones</h1>
          <p className={pageStyles.pageSubtitle}>Ventas, reembolsos pendientes y cortesías de todos tus eventos.</p>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.toolbar} role="group" aria-label="Filtrar notificaciones">
          {filters.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => changeFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {error && !items ? (
          <div className={styles.state} role="alert">
            <p>{error}</p>
            <button type="button" className={styles.retry} onClick={() => setReload((n) => n + 1)}>
              Reintentar
            </button>
          </div>
        ) : items === null ? (
          <SkeletonList rows={6} card={false} label="Cargando notificaciones…" />
        ) : items.length === 0 ? (
          <div className={styles.state}>
            <MaterialIcon decorative name="notifications_off" className={styles.stateIcon} />
            <p>{emptyText[filter]}</p>
          </div>
        ) : (
          <>
            <ul className={styles.list}>
              {items.map((n) => {
                const isNew = new Date(n.at).getTime() > markFrom;
                return (
                  <li key={`${n.type}-${n.id}`}>
                    <Link href={hrefFor(n, canSeeEvents)} className={styles.item} data-new={isNew || undefined}>
                      <span className={styles.icon} data-type={n.type} aria-hidden="true">
                        <MaterialIcon decorative name={typeIcon[n.type]} />
                      </span>
                      <span className={styles.body}>
                        <span className={styles.title}>
                          {n.title}
                          {isNew && <span className={styles.newTag}>Nueva</span>}
                        </span>
                        <span className={styles.detail}>{n.detail}</span>
                      </span>
                      <time className={styles.time} dateTime={n.at} title={formatDateTime(n.at)}>
                        {timeAgo(n.at)}
                      </time>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {error && (
              <p className={styles.inlineError} role="alert">
                {error}
              </p>
            )}
            {hasMore && (
              <button type="button" className={styles.more} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Cargando…" : "Cargar más"}
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}
