import { MaterialIcon } from "@/components/icons";
import { salesPhases } from "@/lib/tickets-management-data";
import styles from "./SalesPhases.module.css";

export default function SalesPhases() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Fases de Venta y Lotes Programados</h2>
          <p className={styles.subtitle}>Reglas de dispersión cronológica y umbrales de agotamiento por tramo tarifario.</p>
        </div>
        <span className={styles.windowBadge}>
          <span className={styles.windowDot} />
          Ventana Actual: Fase 3
        </span>
      </div>

      <div className={styles.grid}>
        {salesPhases.map((phase) => (
          <div key={phase.id} className={styles.card} data-status={phase.status}>
            {phase.status === "en-vivo" && <div className={styles.topBar} />}
            <div>
              <div className={styles.cardHeader}>
                <span className={styles.statusPill} data-status={phase.status}>
                  <MaterialIcon
                    name={phase.status === "en-vivo" ? "bolt" : "check_circle"}
                    className={styles.statusIcon}
                  />
                  {phase.status === "en-vivo" ? "En Vivo" : "Concluida"}
                </span>
                <span className={styles.lote} data-status={phase.status}>
                  {phase.lote}
                </span>
              </div>
              <h3 className={styles.cardTitle}>{phase.title}</h3>
              <p className={styles.cardDescription}>{phase.description}</p>
            </div>
            <div className={styles.progressBlock}>
              <div className={styles.progressLabels}>
                <span className={styles.progressLabel} data-status={phase.status}>
                  {phase.progressLabel}
                </span>
                <span className={styles.progressValue}>{phase.valueLabel}</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  data-status={phase.status}
                  style={{ width: `${phase.percent}%` }}
                />
              </div>
              <div className={styles.progressFoot}>
                <span>{phase.footLeft}</span>
                <span className={styles.progressFootRight} data-status={phase.status}>
                  {phase.footRight}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
