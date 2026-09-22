import Image from "next/image";
import Link from "next/link";
import type { EventCardData } from "@/lib/events";
import styles from "./EventCard.module.css";

export default function EventCard({ event }: { event: EventCardData }) {
  const href = event.slug ? `/eventos/${event.slug}` : undefined;

  return (
    <article className={styles.card}>
      <div className={styles.thumb}>
        <Image
          src={event.image}
          alt={event.alt}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className={styles.thumbImage}
        />
        <div className={styles.dateBadge}>
          <span className={styles.dateDay}>{event.day}</span>
          <span className={styles.dateMonth}>{event.month}</span>
        </div>
        <button type="button" className={styles.favoriteButton} aria-label="Añadir a favoritos">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2.87867 4.212C2.31605 4.77461 1.99997 5.53768 1.99997 6.33333C1.99997 7.12899 2.31605 7.89206 2.87867 8.45467L8 13.576L13.1213 8.45467C14.2921 7.28387 14.2921 5.3828 13.1213 4.212C11.9505 3.0412 10.0495 3.0412 8.87867 4.212L8 5.09067L7.12133 4.212C6.55872 3.64938 5.79566 3.33331 5 3.33331C4.20434 3.33331 3.44128 3.64938 2.87867 4.212V4.212"
              stroke="white"
              strokeWidth="1.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className={styles.body}>
        <div>
          <h3 className={styles.title}>
            {href ? <Link href={href}>{event.title}</Link> : event.title}
          </h3>
          <p className={styles.subtitle}>{event.subtitle}</p>
          <div className={styles.location}>
            <div className={styles.locationRow}>
              <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M10.2999 9.71658L7.82483 12.1917C7.60623 12.4105 7.3096 12.5334 7.00029 12.5334C6.69098 12.5334 6.39436 12.4105 6.17575 12.1917L3.70008 9.71658C1.87771 7.89411 1.87776 4.93939 3.7002 3.11698C5.52264 1.29457 8.47736 1.29457 10.2998 3.11698C12.1222 4.93939 12.1223 7.89411 10.2999 9.71658V9.71658"
                  stroke="#9CA3AF"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{event.venue}</span>
            </div>
            <span className={styles.city}>{event.city}</span>
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.priceRow}>
            <div>
              <span className={styles.priceLabel}>Desde</span>
              <span className={styles.priceValue}>{event.price}</span>
            </div>
            <Link href={href ?? "#"} className={styles.buyButton} aria-label="Ver entradas">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M6 3.33333L10.6667 8L6 12.6667"
                  stroke="white"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
          <div className={styles.tags}>
            {event.tags.map((tag) => (
              <span
                key={tag.label}
                className={`${styles.tag} ${
                  tag.variant === "primary"
                    ? styles.tagPrimary
                    : tag.variant === "orange"
                      ? styles.tagOrange
                      : styles.tagSecondary
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
