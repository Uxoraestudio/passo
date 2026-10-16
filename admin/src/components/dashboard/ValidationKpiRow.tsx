import { MaterialIcon } from "@/components/icons";
import type { ScanResult, ValidationOverview } from "@/lib/validation-data";
import styles from "./ValidationKpiRow.module.css";

const n = (v: number) => v.toLocaleString("es-CL");
const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

/** Entered vs. tickets, good scans, rejections by cause and entry pace (last 15 minutes). */
export default function ValidationKpiRow({ overview }: { overview: ValidationOverview | null }) {
  const o = overview ?? { tickets: 0, entered: 0, scans_ok: 0, scans_rejected: 0, last_15_min: 0, by_result: {} };
  const occupancy = pct(o.entered, o.tickets);
  const scans = o.scans_ok + o.scans_rejected;
  const r: Partial<Record<ScanResult, number>> = o.by_result;
  const perMinute = Math.round((o.last_15_min / 15) * 10) / 10;

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.blob} data-tone="purple" />
        <div className={styles.header}>
          <span className={styles.label}>Público ingresado</span>
          <span className={styles.iconBox} data-tone="purple">
            <MaterialIcon decorative name="groups" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{n(o.entered)}</span>
            <span className={styles.valueSuffix}>/ {n(o.tickets)} {o.tickets === 1 ? "entrada" : "entradas"}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} data-tone="purple" style={{ width: `${Math.min(100, occupancy)}%` }} />
          </div>
        </div>
        <div className={styles.footer}>
          <span className={styles.footerLabel}>{occupancy.toLocaleString("es-CL")}% ingresado</span>
          <span className={styles.footerValue} data-tone="purple">
            {n(Math.max(0, o.tickets - o.entered))} por llegar
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.blob} data-tone="teal" />
        <div className={styles.header}>
          <span className={styles.label}>Escaneos válidos</span>
          <span className={styles.iconBox} data-tone="teal">
            <MaterialIcon decorative name="verified" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{n(o.scans_ok)}</span>
            {scans > 0 && (
              <span className={styles.deltaPill} data-tone="teal">
                {pct(o.scans_ok, scans).toLocaleString("es-CL")}%
              </span>
            )}
          </div>
          <p className={styles.captionText}>{scans > 0 ? `de ${n(scans)} ${scans === 1 ? "escaneo" : "escaneos"} en total` : "Aún no hay escaneos"}</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.blob} data-tone="danger" />
        <div className={styles.header}>
          <span className={styles.label}>Rechazos</span>
          <span className={styles.iconBox} data-tone="danger">
            <MaterialIcon decorative name="gpp_maybe" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value} data-tone={o.scans_rejected > 0 ? "danger" : undefined}>
              {n(o.scans_rejected)}
            </span>
          </div>
          <p className={styles.captionText}>
            {o.scans_rejected > 0
              ? [
                  r.already_used ? `${n(r.already_used)} ya ${r.already_used === 1 ? "usada" : "usadas"}` : null,
                  r.void ? `${n(r.void)} ${r.void === 1 ? "anulada" : "anuladas"}` : null,
                  r.wrong_event ? `${n(r.wrong_event)} de otro evento` : null,
                  r.not_found ? `${n(r.not_found)} no ${r.not_found === 1 ? "reconocida" : "reconocidas"}` : null,
                ]
                  .filter(Boolean)
                  .join(" • ")
              : "Sin rechazos"}
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.blob} data-tone="orange" />
        <div className={styles.header}>
          <span className={styles.label}>Ritmo de ingreso</span>
          <span className={styles.iconBox} data-tone="orange">
            <MaterialIcon decorative name="speed" className={styles.icon} />
          </span>
        </div>
        <div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{perMinute.toLocaleString("es-CL")}</span>
            <span className={styles.valueSuffix}>por minuto</span>
          </div>
          <p className={styles.captionText}>
            {n(o.last_15_min)} {o.last_15_min === 1 ? "ingreso" : "ingresos"} en los últimos 15 minutos
          </p>
        </div>
      </div>
    </div>
  );
}
