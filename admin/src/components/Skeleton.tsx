import type { CSSProperties, ReactNode } from "react";
import styles from "./Skeleton.module.css";

/**
 * Loading placeholders that mirror each screen's layout, so content fades in
 * where the grey shapes were instead of jumping in after a "Cargando…" text.
 */

type Size = number | string;

export function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
  className,
  style,
}: {
  width?: Size;
  height?: Size;
  radius?: Size;
  className?: string;
  style?: CSSProperties;
}) {
  return <span className={`${styles.bone} ${className ?? ""}`} style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

/** Wraps a placeholder so screen readers hear one "Cargando…" instead of nothing. */
function Busy({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className} role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function SkeletonKpis({ count = 4, label = "Cargando indicadores…" }: { count?: number; label?: string }) {
  return (
    <Busy label={label} className={styles.kpis}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.rowBetween}>
            <Skeleton width="45%" height={12} />
            <Skeleton width={36} height={36} radius={10} />
          </div>
          <Skeleton width="60%" height={30} radius={10} />
          <Skeleton width="70%" height={12} />
        </div>
      ))}
    </Busy>
  );
}

export function SkeletonChart({ height = 280, label = "Cargando gráfico…" }: { height?: number; label?: string }) {
  return (
    <Busy label={label} className={styles.card}>
      <Skeleton width="35%" height={16} />
      <Skeleton width="55%" height={12} />
      <div className={styles.chart} style={{ height }}>
        {[55, 70, 45, 80, 62, 90, 74, 58, 85, 66, 95, 72].map((h, i) => (
          <Skeleton key={i} height={`${h}%`} radius={6} />
        ))}
      </div>
    </Busy>
  );
}

export function SkeletonTable({ rows = 6, columns = 5, label = "Cargando tabla…", title = true }: { rows?: number; columns?: number; label?: string; title?: boolean }) {
  return (
    <Busy label={label} className={styles.card}>
      {title && (
        <div className={styles.rowBetween}>
          <Skeleton width="30%" height={16} />
          <Skeleton width={160} height={30} radius={999} />
        </div>
      )}
      <div className={styles.table}>
        {Array.from({ length: rows + 1 }, (_, r) => (
          <div key={r} className={`${styles.tableRow} ${r === 0 ? styles.tableHead : ""}`} style={{ gridTemplateColumns: `2fr repeat(${columns - 1}, 1fr)` }}>
            {Array.from({ length: columns }, (_, c) =>
              c === 0 && r > 0 ? (
                <div key={c} className={styles.stack}>
                  <Skeleton width="70%" height={13} />
                  <Skeleton width="50%" height={11} />
                </div>
              ) : (
                <Skeleton key={c} width={r === 0 ? "50%" : `${55 + ((r * 7 + c * 13) % 35)}%`} height={r === 0 ? 10 : 13} />
              )
            )}
          </div>
        ))}
      </div>
    </Busy>
  );
}

/** Rows with an icon or thumbnail, a title, a detail line and something on the right. */
export function SkeletonList({
  rows = 5,
  thumb = "icon",
  label = "Cargando…",
  card = true,
}: {
  rows?: number;
  thumb?: "icon" | "image" | "none";
  label?: string;
  card?: boolean;
}) {
  return (
    <Busy label={label} className={card ? styles.card : styles.bare}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.listRow}>
          {thumb === "icon" && <Skeleton width={40} height={40} radius={12} />}
          {thumb === "image" && <Skeleton width={88} height={88} radius={12} />}
          <div className={styles.listBody}>
            <Skeleton width={`${50 + ((i * 17) % 30)}%`} height={14} />
            <Skeleton width={`${35 + ((i * 11) % 25)}%`} height={12} />
          </div>
          <Skeleton width={72} height={12} />
        </div>
      ))}
    </Busy>
  );
}

export function SkeletonForm({ fields = 6, label = "Cargando formulario…" }: { fields?: number; label?: string }) {
  return (
    <Busy label={label} className={styles.card}>
      <Skeleton width="30%" height={18} />
      <div className={styles.formGrid}>
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className={`${styles.stack} ${i % 5 === 4 ? styles.full : ""}`}>
            <Skeleton width={90} height={11} />
            <Skeleton height={i % 5 === 4 ? 96 : 44} radius={10} />
          </div>
        ))}
      </div>
    </Busy>
  );
}

export function SkeletonCards({ count = 6, label = "Cargando…" }: { count?: number; label?: string }) {
  return (
    <Busy label={label} className={styles.cards}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.card}>
          <Skeleton height={120} radius={12} />
          <Skeleton width="65%" height={16} />
          <Skeleton width="45%" height={12} />
          <div className={styles.rowBetween}>
            <Skeleton width="30%" height={12} />
            <Skeleton width={90} height={32} radius={10} />
          </div>
        </div>
      ))}
    </Busy>
  );
}

/** Canvas editors (venue plan, event seats): big canvas plus a side panel. */
export function SkeletonEditor({ label = "Cargando editor…" }: { label?: string }) {
  return (
    <Busy label={label} className={styles.editor}>
      <div className={styles.editorTop}>
        <Skeleton width={220} height={20} />
        <div className={styles.row}>
          <Skeleton width={90} height={34} radius={10} />
          <Skeleton width={110} height={34} radius={10} />
        </div>
      </div>
      <div className={styles.editorBody}>
        <Skeleton height="100%" radius={16} className={styles.canvas} />
        <div className={`${styles.card} ${styles.editorSide}`}>
          <Skeleton width="50%" height={14} />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={styles.stack}>
              <Skeleton width={70} height={10} />
              <Skeleton height={34} radius={9} />
            </div>
          ))}
        </div>
      </div>
    </Busy>
  );
}

/** Page header: title, subtitle and an action on the right. */
export function SkeletonHeader({ actions = 1 }: { actions?: number }) {
  return (
    <div className={styles.header} aria-hidden="true">
      <div className={styles.stack}>
        <Skeleton width={260} height={30} radius={10} />
        <Skeleton width={360} height={14} />
      </div>
      <div className={styles.row}>
        {Array.from({ length: actions }, (_, i) => (
          <Skeleton key={i} width={130} height={40} radius={12} />
        ))}
      </div>
    </div>
  );
}

/** Whole admin screen while the session is checked: sidebar, top bar and content. */
export function SkeletonShell() {
  return (
    <div className={styles.shell} role="status" aria-busy="true">
      <span className="sr-only">Cargando el panel…</span>
      <aside className={styles.sidebar} aria-hidden="true">
        <span className={`${styles.bone} ${styles.dark}`} style={{ width: 120, height: 28, borderRadius: 8 }} />
        <div className={styles.navList}>
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className={styles.navItem}>
              <span className={`${styles.bone} ${styles.dark}`} style={{ width: 20, height: 20, borderRadius: 6 }} />
              <span className={`${styles.bone} ${styles.dark}`} style={{ width: `${45 + ((i * 13) % 35)}%`, height: 12, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </aside>
      <div className={styles.shellContent} aria-hidden="true">
        <div className={styles.topbar}>
          <Skeleton width={36} height={36} radius={12} />
          <Skeleton width={150} height={36} radius={12} />
        </div>
        <div className={styles.main}>
          <SkeletonHeader />
          <div className={styles.kpis}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={styles.card}>
                <Skeleton width="45%" height={12} />
                <Skeleton width="60%" height={30} radius={10} />
                <Skeleton width="70%" height={12} />
              </div>
            ))}
          </div>
          <div className={styles.card}>
            <Skeleton width="30%" height={16} />
            <Skeleton height={220} radius={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
