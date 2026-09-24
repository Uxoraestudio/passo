import { sCurveChart } from "@/lib/reports-data";
import styles from "./SCurveChart.module.css";

export default function SCurveChart() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Curva de Venta Acumulada vs Tiempo</h2>
          <p className={styles.subtitle}>Monitoreo de curva S: Venta anticipada, meseta publicitaria y aceleración última semana</p>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} />
            Real 2025
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDash} />
            Proyección Meta
          </span>
        </div>
      </div>

      <div className={styles.chartFrame}>
        <svg className={styles.chart} viewBox="0 0 600 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="reportsSCurveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6534f5" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6534f5" stopOpacity="0" />
            </linearGradient>
          </defs>

          <line x1="0" x2="600" y1="40" y2="40" stroke="#cac3d9" strokeOpacity="0.3" strokeDasharray="3,3" />
          <line x1="0" x2="600" y1="90" y2="90" stroke="#cac3d9" strokeOpacity="0.3" strokeDasharray="3,3" />
          <line x1="0" x2="600" y1="140" y2="140" stroke="#cac3d9" strokeOpacity="0.3" strokeDasharray="3,3" />

          <path d={sCurveChart.benchmarkPath} fill="none" stroke="#797488" strokeWidth="2" strokeDasharray="4,4" />
          <path d={sCurveChart.areaPath} fill="url(#reportsSCurveGrad)" />
          <path d={sCurveChart.linePath} fill="none" stroke="#6534f5" strokeWidth="3.5" strokeLinecap="round" />

          <circle cx="110" cy="145" r="4.5" fill="#ff782d" />
          <circle cx="600" cy="12" r="5" fill="#005438" />
        </svg>

        <div className={styles.annotationLeft}>
          <span className={styles.annotationTitle}>Lanzamiento Preventa</span>
          <span className={styles.annotationCaption}>12.400 tickets / 48 hrs</span>
        </div>
        <div className={styles.annotationRight}>
          <span className={styles.annotationTitleTeal}>Sold Out Cancha VIP</span>
          <span className={styles.annotationCaption}>35.955 tickets totales</span>
        </div>

        <div className={styles.xLabels}>
          {sCurveChart.xLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerDot} />
          <span className={styles.footerText}>{sCurveChart.breakevenNote}</span>
        </div>
        <button type="button" className={styles.footerLink}>
          Ver detalle por hora
        </button>
      </div>
    </div>
  );
}
