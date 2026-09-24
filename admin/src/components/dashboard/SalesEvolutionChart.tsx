import { MaterialIcon } from "@/components/icons";
import { evolutionChart } from "@/lib/sales-data";
import styles from "./SalesEvolutionChart.module.css";

export default function SalesEvolutionChart() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Evolución Diaria de Ventas y Tickets</h2>
          <p className={styles.subtitle}>Recaudación en CLP vs volumen diario de entradas emitidas</p>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} data-tone="purple" />
            Monto CLP
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} data-tone="orange" />
            Entradas Vendidas
          </span>
        </div>
      </div>

      <div className={styles.chartWrap}>
        <svg className={styles.chart} viewBox="0 0 700 240" preserveAspectRatio="none">
          <defs>
            <linearGradient id="salesAmountGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6534f5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6534f5" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="salesTicketsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff782d" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ff782d" stopOpacity="0" />
            </linearGradient>
          </defs>

          <line x1="0" x2="700" y1="40" y2="40" stroke="#f1ebff" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" x2="700" y1="90" y2="90" stroke="#f1ebff" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" x2="700" y1="140" y2="140" stroke="#f1ebff" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" x2="700" y1="190" y2="190" stroke="#f1ebff" strokeWidth="1" strokeDasharray="4 4" />

          <path d={evolutionChart.amountArea} fill="url(#salesAmountGrad)" />
          <path d={evolutionChart.amountLine} fill="none" stroke="#6534f5" strokeWidth="3" strokeLinecap="round" />

          <path d={evolutionChart.ticketsArea} fill="url(#salesTicketsGrad)" />
          <path d={evolutionChart.ticketsLine} fill="none" stroke="#ff782d" strokeWidth="2.5" strokeLinecap="round" />

          {evolutionChart.amountMarkers.map((marker) => (
            <circle
              key={`amount-${marker.cx}-${marker.cy}`}
              cx={marker.cx}
              cy={marker.cy}
              r={marker.emphasis ? 5 : 4.5}
              fill={marker.emphasis ? "#4c00da" : "#6534f5"}
              stroke="#ffffff"
              strokeWidth={marker.emphasis ? 2.5 : 2}
            />
          ))}
          {evolutionChart.ticketMarkers.map((marker) => (
            <circle key={`ticket-${marker.cx}-${marker.cy}`} cx={marker.cx} cy={marker.cy} r="4" fill="#ff782d" stroke="#ffffff" strokeWidth="2" />
          ))}
        </svg>

        <div className={styles.xLabels}>
          {evolutionChart.xLabels.map((label, index) => (
            <span key={label} className={styles.xLabel} data-emphasis={index === evolutionChart.xLabels.length - 1}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <MaterialIcon name="verified" className={styles.footerIcon} />
          <span className={styles.footerStrong}>Pico de conversión registrado:</span>
          <span className={styles.footerMuted}>{evolutionChart.peakNote}</span>
        </div>
        <button type="button" className={styles.footerLink}>
          <span>Ver informe de tráfico</span>
          <MaterialIcon name="arrow_forward" className={styles.footerLinkIcon} />
        </button>
      </div>
    </div>
  );
}
