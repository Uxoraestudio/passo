import Link from "next/link";
import EventCard from "./EventCard";
import { featuredEvents } from "@/lib/events";
import styles from "./EventsGrid.module.css";

export default function FeaturedEvents() {
  return (
    <section id="eventos-destacados" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Eventos destacados</h2>
            <p className={styles.subtitle}>Grandes experiencias te están esperando.</p>
          </div>
          <Link href="/eventos" className={styles.link}>
            <span>Ver todos los eventos</span>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M9.33333 3.33333L14 8M14 8L9.33333 12.6667M14 8H2"
                stroke="#6534F5"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
        <div className={styles.grid}>
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
