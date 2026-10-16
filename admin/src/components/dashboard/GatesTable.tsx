import type { ValidationOverview } from "@/lib/validation-data";
import styles from "./GatesTable.module.css";

const n = (v: number) => v.toLocaleString("es-CL");
const time = (iso: string) => new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

/** How many got in per sector (against the tickets sold) and per door. */
export default function GatesTable({ overview }: { overview: ValidationOverview | null }) {
  const sectors = overview?.sectors ?? [];
  const gates = overview?.gates ?? [];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ingresos por sector</h2>
      </div>
      <p className={styles.subtitle}>Público que ya entró frente a las entradas emitidas de cada sector.</p>

      {sectors.length === 0 ? (
        <p className={styles.empty}>Este evento todavía no tiene entradas emitidas.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sector</th>
                <th>Ingresados</th>
                <th>Avance</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((s) => {
                const percent = s.tickets > 0 ? Math.round((s.entered / s.tickets) * 1000) / 10 : 0;
                return (
                  <tr key={s.name}>
                    <td className={styles.gateName}>{s.name}</td>
                    <td className={styles.strong}>
                      {n(s.entered)} <span className={styles.muted}>/ {n(s.tickets)}</span>
                    </td>
                    <td>
                      <div className={styles.capacityCell}>
                        <span className={styles.percentLabel}>{percent.toLocaleString("es-CL")}%</span>
                        <div className={styles.progressTrack}>
                          <div className={styles.progressFill} style={{ width: `${Math.min(100, percent)}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.header} style={{ marginTop: 22 }}>
        <h2 className={styles.title}>Por puerta</h2>
      </div>
      {gates.length === 0 ? (
        <p className={styles.empty}>Los ingresos se agrupan por la puerta indicada en la consola.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Puerta</th>
                <th>Ingresos</th>
                <th>Rechazos</th>
                <th>Último</th>
              </tr>
            </thead>
            <tbody>
              {gates.map((g) => (
                <tr key={g.gate}>
                  <td className={styles.gateName}>{g.gate}</td>
                  <td className={styles.strong}>{n(g.entered)}</td>
                  <td>
                    <span className={styles.statusPill} data-warning={g.rejected > 0}>
                      {n(g.rejected)}
                    </span>
                  </td>
                  <td className={styles.muted}>{time(g.last_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
