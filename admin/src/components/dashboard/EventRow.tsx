import Image from "next/image";
import { MaterialIcon } from "@/components/icons";
import type { ManagedEvent } from "@/lib/events-management-data";
import styles from "./EventRow.module.css";

export default function EventRow({ event }: { event: ManagedEvent }) {
  return (
    <div className={styles.row}>
      <div className={styles.leftBar} style={{ background: event.leftBarColor }} />

      <div className={styles.mainInfo}>
        <div className={styles.thumb}>
          {event.image ? (
            <Image src={event.image} alt={event.title} fill sizes="96px" className={styles.thumbImage} />
          ) : (
            <div className={styles.thumbFallback}>
              <MaterialIcon name={event.iconFallback ?? "event"} className={styles.thumbIcon} />
            </div>
          )}
          <span className={styles.badge} data-tone={event.badgeTone}>
            {event.badge}
          </span>
        </div>

        <div className={styles.info}>
          <div className={styles.statusRow}>
            <span className={styles.statusPill} data-tone={event.statusTone}>
              {event.statusLabel}
            </span>
            <span className={styles.meta}>{event.meta}</span>
          </div>
          <h3 className={styles.title}>{event.title}</h3>
          <div className={styles.subMeta}>
            <span className={styles.subMetaItem}>
              <MaterialIcon name="event" className={`${styles.subMetaIcon} ${styles.subMetaIconDate}`} />
              {event.date}
            </span>
            <span className={styles.subMetaItem}>
              <MaterialIcon name={event.venueIcon} className={`${styles.subMetaIcon} ${styles.subMetaIconVenue}`} />
              {event.venue}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.sideInfo}>
        <div className={styles.progressBlock}>
          <div className={styles.progressLabels}>
            <span className={styles.progressLabel}>{event.progress.label}</span>
            <span className={styles.progressValue}>{event.progress.valueLabel}</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${event.progress.percent}%`, background: event.progress.gradient }}
            />
          </div>
          <div className={styles.progressFoot}>
            <span>{event.progress.footLeft}</span>
            <span style={{ color: event.progress.footRightColor }} className={styles.progressFootRight}>
              {event.progress.footRight}
            </span>
          </div>
        </div>

        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>{event.metric.label}</span>
          <span className={styles.metricValue}>{event.metric.value}</span>
          <span className={styles.metricCaption}>{event.metric.caption}</span>
        </div>

        <div className={styles.actions}>
          {event.actions.map((action) => (
            <button key={action.label} type="button" className={styles.actionButton} data-tone={action.tone}>
              <MaterialIcon name={action.icon} className={styles.actionIcon} />
              <span>{action.label}</span>
            </button>
          ))}
          <button
            type="button"
            className={styles.trailingButton}
            data-danger={event.trailingAction.danger}
            title={event.trailingAction.title}
            aria-label={event.trailingAction.title}
          >
            <MaterialIcon name={event.trailingAction.icon} className={styles.trailingIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
