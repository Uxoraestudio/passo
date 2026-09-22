import { gateRows } from "@/lib/qr-validation-data";
import styles from "./GatesTable.module.css";

export default function GatesTable() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Desglose por Puertas y Accesos</h2>
        <button type="button" className={styles.link}>
          4 Accesos Operativos
        </button>
      </div>
      <p className={styles.subtitle}>Estado en tiempo real de torniquetes y flujo peatonal.</p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Puerta &amp; Sector</th>
              <th>Validados</th>
              <th>Capacidad Sector</th>
              <th>Terminales</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {gateRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className={styles.gateCell}>
                    <span className={styles.dot} style={{ background: row.dotColor }} />
                    <div>
                      <span className={styles.gateName}>{row.name}</span>
                      <span className={styles.gateLocation}>{row.location}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.strong}>{row.validated}</td>
                <td>
                  <div className={styles.capacityCell}>
                    <span className={styles.percentLabel}>{row.percentLabel}</span>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressFill}
                        data-warning={row.status === "Alta Carga"}
                        style={{ width: `${row.percent}%` }}
                      />
                    </div>
                    <span className={styles.capacityMax}>{row.capacityLabel}</span>
                  </div>
                </td>
                <td className={styles.muted}>{row.active}</td>
                <td>
                  <span className={styles.statusPill} data-warning={row.status === "Alta Carga"}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
