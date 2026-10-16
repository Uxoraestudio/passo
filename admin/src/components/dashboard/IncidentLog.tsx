import { MaterialIcon } from "@/components/icons";
import { RESULT_TEXT, type RecentScan } from "@/lib/validation-data";
import styles from "./IncidentLog.module.css";

const ICONS = { ok: "check_circle", warn: "history", bad: "block" } as const;
const time = (iso: string) => new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** The latest scans of the event, rejections first in mind: who, where and why. */
export default function IncidentLog({ scans, onlyRejected, onToggle }: { scans: RecentScan[]; onlyRejected: boolean; onToggle: () => void }) {
  const shown = onlyRejected ? scans.filter((s) => s.result !== "valid") : scans;
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.headerLeft}>
          <MaterialIcon decorative name="receipt_long" className={styles.headerIcon} />
          <h2 className={styles.title}>Registro en vivo</h2>
        </span>
        <button type="button" className={styles.filterButton} aria-pressed={onlyRejected} onClick={onToggle}>
          {onlyRejected ? "Ver todos" : "Solo rechazos"}
        </button>
      </div>

      {shown.length === 0 ? (
        <p className={styles.empty}>{onlyRejected ? "Sin rechazos por ahora." : "Aquí aparecerá cada escaneo, con su resultado."}</p>
      ) : (
        <div className={styles.list}>
          {shown.map((scan) => {
            const text = RESULT_TEXT[scan.result];
            return (
              <div key={scan.id} className={styles.item}>
                <span className={styles.itemIconBox} data-tone={text.tone}>
                  <MaterialIcon decorative name={ICONS[text.tone]} className={styles.itemIcon} />
                </span>
                <div className={styles.itemText}>
                  <div className={styles.itemTitleRow}>
                    <span className={styles.itemTitle}>{text.title}</span>
                    <span className={styles.itemCode}>{scan.input}</span>
                  </div>
                  <p className={styles.itemDescription}>
                    {scan.holder || scan.sector ? [scan.holder ?? "Sin nominar", scan.sector, scan.seat].filter(Boolean).join(" • ") : "Sin entrada asociada"}
                  </p>
                </div>
                <div className={styles.itemMeta}>
                  <span className={styles.itemTime}>{time(scan.at)}</span>
                  <span className={styles.itemTerminal}>{scan.gate ?? "Sin puerta"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
