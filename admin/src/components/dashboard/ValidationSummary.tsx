import type { ValidationOverview } from "@/lib/validation-data";
import styles from "./ValidationSummary.module.css";

const n = (v: number) => v.toLocaleString("es-CL");

/** The three numbers a door needs at a glance: how many are in, how many were turned away, how fast. */
export default function ValidationSummary({ overview }: { overview: ValidationOverview | null }) {
  const o = overview ?? { tickets: 0, entered: 0, scans_rejected: 0, last_15_min: 0 };
  const percent = o.tickets > 0 ? Math.min(100, Math.round((o.entered / o.tickets) * 100)) : 0;
  const perMinute = Math.round((o.last_15_min / 15) * 10) / 10;

  return (
    <section className={styles.card} aria-label="Resumen del ingreso">
      <div className={styles.main}>
        <span className={styles.label}>Han ingresado</span>
        <span className={styles.value}>
          {n(o.entered)} <small>de {n(o.tickets)}</small>
        </span>
        <span className={styles.track} aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </span>
        <span className={styles.caption}>
          {percent}% · faltan {n(Math.max(0, o.tickets - o.entered))}
        </span>
      </div>
      <div className={styles.side}>
        <div className={styles.stat}>
          <span className={styles.label}>Rechazos</span>
          <span className={styles.statValue} data-tone={o.scans_rejected > 0 ? "bad" : undefined}>
            {n(o.scans_rejected)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Por minuto</span>
          <span className={styles.statValue}>{perMinute.toLocaleString("es-CL")}</span>
        </div>
      </div>
    </section>
  );
}
