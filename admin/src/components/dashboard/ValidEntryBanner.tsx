import { MaterialIcon } from "@/components/icons";
import { RESULT_TEXT, type ValidationResponse } from "@/lib/validation-data";
import styles from "./ValidEntryBanner.module.css";

const ICONS = { ok: "check_circle", warn: "history", bad: "block" } as const;

const time = (iso: string) => new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Result of the last scan: green lets in, amber and red don't. Big enough to read at arm's length. */
export default function ValidEntryBanner({ scan }: { scan: { response: ValidationResponse; at: string; gate: string } | null }) {
  if (!scan) {
    return (
      <div className={styles.banner} data-tone="idle" role="status">
        <div className={styles.left}>
          <span className={styles.checkIcon}>
            <MaterialIcon name="qr_code_scanner" className={styles.checkIconGlyph} />
          </span>
          <div>
            <p className={styles.name}>Esperando la primera entrada</p>
            <p className={styles.details}>Escanea un QR o escribe el código corto para validarlo.</p>
          </div>
        </div>
      </div>
    );
  }

  const { response, at, gate } = scan;
  const text = RESULT_TEXT[response.result];
  const t = response.ticket;
  const details =
    response.result === "already_used" && t?.used_at
      ? `Ingresó a las ${time(t.used_at)}${t.used_gate ? ` por ${t.used_gate}` : ""}`
      : response.result === "wrong_event" && t
        ? `Es para «${t.event}»`
        : t
          ? [t.sector, t.seat].filter(Boolean).join(" • ")
          : "No corresponde a ninguna entrada emitida";

  return (
    <div className={styles.banner} data-tone={text.tone} role="alert" aria-live="assertive">
      <div className={styles.left}>
        <span className={styles.checkIcon}>
          <MaterialIcon name={ICONS[text.tone]} className={styles.checkIconGlyph} />
        </span>
        <div>
          <div className={styles.metaRow}>
            <span className={styles.badge}>{text.title}</span>
            <span className={styles.metaText}>
              {time(at)}
              {gate ? ` • ${gate}` : ""}
            </span>
          </div>
          {t && (
            <p className={styles.name}>
              {t.holder ?? "Entrada sin nominar"}
              {t.document ? ` — ${t.document}` : ""}
            </p>
          )}
          <p className={styles.details}>{details}</p>
        </div>
      </div>
      <div className={styles.right}>
        <span className={styles.grantedPill}>{text.detail}</span>
      </div>
    </div>
  );
}
