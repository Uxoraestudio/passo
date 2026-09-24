import { MaterialIcon } from "@/components/icons";
import { paymentSegments } from "@/lib/sales-data";
import styles from "./PaymentBreakdown.module.css";

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PaymentBreakdown() {
  const arcs = paymentSegments.reduce<Array<(typeof paymentSegments)[number] & { length: number; dashOffset: number }>>(
    (acc, segment) => {
      const previousOffset = acc.length > 0 ? -acc[acc.length - 1].dashOffset + acc[acc.length - 1].length : 0;
      const length = (segment.percent / 100) * CIRCUMFERENCE;
      acc.push({ ...segment, length, dashOffset: -previousOffset });
      return acc;
    },
    []
  );

  return (
    <div className={styles.card}>
      <div>
        <div className={styles.header}>
          <h2 className={styles.title}>Medios de Pago</h2>
          <MaterialIcon name="account_balance_wallet" className={styles.headerIcon} />
        </div>
        <p className={styles.subtitle}>Distribución transaccional por pasarela integrada</p>

        <div className={styles.donutWrap}>
          <svg className={styles.donut} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#f1ebff" strokeWidth="12" />
            {arcs.map((arc) => (
              <circle
                key={arc.id}
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth="12"
                strokeDasharray={`${arc.length} ${CIRCUMFERENCE}`}
                strokeDashoffset={arc.dashOffset}
              />
            ))}
          </svg>
          <div className={styles.donutCenter}>
            <span className={styles.donutValue}>{paymentSegments[0].percent}%</span>
            <span className={styles.donutLabel}>{paymentSegments[0].label}</span>
          </div>
        </div>

        <div className={styles.list}>
          {paymentSegments.map((segment) => (
            <div key={segment.id} className={styles.listRow}>
              <span className={styles.listLeft}>
                <span className={styles.listDot} style={{ background: segment.color }} />
                <span className={styles.listLabel}>{segment.label}</span>
              </span>
              <span className={styles.listRight}>
                <span className={styles.listPercent}>{segment.percent}%</span>
                <span className={styles.listAmount}>{segment.amount}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <span>Tasa de contracargo promedio:</span>
        <span className={styles.footerValue}>0.02% (Bajo)</span>
      </div>
    </div>
  );
}
