import EventCard from "./EventCard";
import { nearYouEvents } from "@/lib/events";
import styles from "./EventsGrid.module.css";

export default function NearYou() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Cerca de ti</h2>
            <p className={styles.subtitle}>Descubre eventos increíbles en tu ciudad.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.citySelector}>
              <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M10.2999 9.71658L7.82483 12.1917C7.60623 12.4105 7.3096 12.5334 7.00029 12.5334C6.69098 12.5334 6.39436 12.4105 6.17575 12.1917L3.70008 9.71658C1.87771 7.89411 1.87776 4.93939 3.7002 3.11698C5.52264 1.29457 8.47736 1.29457 10.2998 3.11698C12.1222 4.93939 12.1223 7.89411 10.2999 9.71658V9.71658"
                  stroke="#9CA3AF"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Santiago</span>
              <svg viewBox="0 0 10.6667 6" fill="none" className={styles.chevron} aria-hidden="true">
                <path
                  d="M10 0.666667L5.33333 5.33333L0.666667 0.666667"
                  stroke="#9CA3AF"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <a href="#" className={styles.link}>
              <span>Ver todos</span>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M9.33333 3.33333L14 8M14 8L9.33333 12.6667M14 8H2"
                  stroke="#6534F5"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
        <div className={styles.grid}>
          {nearYouEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
