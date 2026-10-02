"use client";

import Link from "next/link";
import EventCard from "@/components/EventCard";
import type { EventCardData } from "@/lib/events";
import { useFavorites } from "@/lib/favorites";
import styles from "./AccountPanels.module.css";

export default function AccountFavorites({ events }: { events: EventCardData[] }) {
  const { favorites } = useFavorites();
  const saved = events.filter((event) => favorites.includes(event.id));

  if (saved.length === 0) {
    return (
      <div className={styles.panel}>
        <span className={styles.panelIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 19.5s-7.5-4.3-7.5-9.7A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6c0 5.4-7.5 9.7-7.5 9.7Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 className={styles.panelTitle}>Aún no guardas eventos</h2>
        <p className={styles.panelText}>Toca el corazón de cualquier evento para tenerlo a mano aquí y no perderte la venta.</p>
        <Link href="/eventos" className={styles.primaryAction}>
          Explorar eventos
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.favoritesGrid}>
      {saved.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
