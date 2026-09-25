"use client";

import Image from "next/image";
import { MaterialIcon } from "@/components/icons";
import type { EventRecord } from "@/lib/events-data";
import { derivePresentation } from "@/lib/events-presentation";
import styles from "./EventRow.module.css";

export default function EventRow({
  event,
  onEdit,
  onDelete,
}: {
  event: EventRecord;
  onEdit: (event: EventRecord) => void;
  onDelete: (event: EventRecord) => void;
}) {
  const p = derivePresentation(event);

  return (
    <div className={styles.row}>
      <div className={styles.leftBar} style={{ background: p.leftBarColor }} />

      <div className={styles.mainInfo}>
        <div className={styles.thumb}>
          {event.image_url ? (
            <Image src={event.image_url} alt={event.title} fill sizes="96px" className={styles.thumbImage} unoptimized />
          ) : (
            <div className={styles.thumbFallback}>
              <MaterialIcon name="event" className={styles.thumbIcon} />
            </div>
          )}
          <span className={styles.badge} data-tone={p.badgeTone}>
            {p.badge}
          </span>
        </div>

        <div className={styles.info}>
          <div className={styles.statusRow}>
            <span className={styles.statusPill} data-tone={p.statusTone}>
              {p.statusLabel}
            </span>
            <span className={styles.meta}>{event.venue}</span>
          </div>
          <h3 className={styles.title}>{event.title}</h3>
          <div className={styles.subMeta}>
            <span className={styles.subMetaItem}>
              <MaterialIcon name="event" className={`${styles.subMetaIcon} ${styles.subMetaIconDate}`} />
              {p.dateLabel}
            </span>
            <span className={styles.subMetaItem}>
              <MaterialIcon name="location_on" className={`${styles.subMetaIcon} ${styles.subMetaIconVenue}`} />
              {event.venue}, {event.city}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.sideInfo}>
        <div className={styles.progressBlock}>
          <div className={styles.progressLabels}>
            <span className={styles.progressLabel}>Ocupación ({p.percent}%)</span>
            <span className={styles.progressValue}>{p.progressValueLabel}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${p.percent}%`, background: p.gradient }} />
          </div>
          <div className={styles.progressFoot}>
            <span>{p.footLeft}</span>
          </div>
        </div>

        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>{p.metricLabel}</span>
          <span className={styles.metricValue}>{p.metricValue}</span>
          <span className={styles.metricCaption}>{p.metricCaption}</span>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.actionButton} data-tone="neutral" onClick={() => onEdit(event)}>
            <MaterialIcon name={p.primaryActionIcon} className={styles.actionIcon} />
            <span>{p.primaryActionLabel}</span>
          </button>
          <button type="button" className={styles.actionButton} data-tone={p.secondaryActionTone} onClick={() => onEdit(event)}>
            <MaterialIcon name={p.secondaryActionIcon} className={styles.actionIcon} />
            <span>{p.secondaryActionLabel}</span>
          </button>
          <button
            type="button"
            className={styles.trailingButton}
            data-danger={p.trailingDanger}
            title={p.trailingTitle}
            aria-label={p.trailingTitle}
            onClick={() => onDelete(event)}
          >
            <MaterialIcon name={p.trailingIcon} className={styles.trailingIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
