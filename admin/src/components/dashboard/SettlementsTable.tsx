import { MaterialIcon } from "@/components/icons";
import { settlementRows, settlementTotals } from "@/lib/reports-data";
import styles from "./SettlementsTable.module.css";

const statusToneMap: Record<string, string> = {
  Pagado: "teal",
  "En Tránsito (48h)": "purple",
  "Venta Activa": "orange",
  "Preventa 1": "orange",
};

export default function SettlementsTable() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Detalle de Liquidaciones y Balance por Evento</h2>
          <p className={styles.subtitle}>Conciliación neta después de comisiones AFORIQ Passo, IVA crédito fiscal y tasas bancarias</p>
        </div>
        <div className={styles.auditBadge}>
          <span>Auditoría:</span>
          <span className={styles.auditPill}>Transacciones Tokenizadas SHA-256</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Evento / Producción</th>
              <th className={styles.right}>Recaudación Bruta</th>
              <th className={styles.right}>Fee Ticketing (8%)</th>
              <th className={styles.right}>IVA Retenido (19%)</th>
              <th className={styles.right}>Pasarela (1.49%)</th>
              <th className={styles.right}>Saldo Líquido Prod.</th>
              <th className={styles.center}>Estado Liquidación</th>
              <th className={styles.center}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {settlementRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className={styles.eventCell}>
                    <span className={styles.thumb}>
                      {row.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.image} alt="" className={styles.thumbImg} />
                      ) : (
                        <MaterialIcon name={row.fallbackIcon ?? "event"} className={styles.thumbIcon} />
                      )}
                    </span>
                    <div>
                      <span className={styles.eventName}>{row.name}</span>
                      <span className={styles.eventVenue}>
                        {row.venue} • {row.date}
                      </span>
                    </div>
                  </div>
                </td>
                <td className={`${styles.right} ${styles.grossValue}`}>{row.gross}</td>
                <td className={`${styles.right} ${styles.muted}`}>{row.fee}</td>
                <td className={`${styles.right} ${styles.muted}`}>{row.vat}</td>
                <td className={`${styles.right} ${styles.muted}`}>{row.gateway}</td>
                <td className={`${styles.right} ${styles.netValue}`} data-tone={row.netTone}>
                  {row.netSettlement}
                </td>
                <td className={styles.center}>
                  <span className={styles.statusPill} data-tone={statusToneMap[row.status]}>
                    <span className={styles.statusDot} data-tone={statusToneMap[row.status]} />
                    {row.status}
                  </span>
                </td>
                <td className={styles.center}>
                  <button type="button" className={styles.actionButton} title="Descargar comprobante de liquidación">
                    <MaterialIcon name="receipt_long" className={styles.actionIcon} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalsRow}>
              <td>Consolidado Total Activo</td>
              <td className={styles.right}>{settlementTotals.gross}</td>
              <td className={`${styles.right} ${styles.muted}`}>{settlementTotals.fee}</td>
              <td className={`${styles.right} ${styles.muted}`}>{settlementTotals.vat}</td>
              <td className={`${styles.right} ${styles.muted}`}>{settlementTotals.gateway}</td>
              <td className={`${styles.right} ${styles.totalNet}`}>{settlementTotals.net}</td>
              <td className={styles.center} colSpan={2}>
                <span className={styles.liquidityNote}>Liquidez Directa a Cuenta Corriente</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
