import { MaterialIcon } from "@/components/icons";
import { venueLedger } from "@/lib/tickets-management-data";
import styles from "./VenueMap.module.css";

export default function VenueMap() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Mapa Esquemático de Aforo</h3>
          <p className={styles.subtitle}>Carga volumétrica por zona en Movistar Arena</p>
        </div>
        <MaterialIcon name="map" className={styles.headerIcon} />
      </div>

      <div className={styles.mapWrap}>
        <svg className={styles.svg} viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
          <rect x="90" y="10" width="140" height="24" rx="4" fill="#1c1a2a" />
          <text x="160" y="26" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="700" fill="#ffffff">
            ESCENARIO PRINCIPAL
          </text>

          <rect x="75" y="44" width="170" height="42" rx="6" fill="#ff5722" fillOpacity="0.9" />
          <text x="160" y="62" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="700" fill="#ffffff">
            CANCHA FRONTAL
          </text>
          <text x="160" y="76" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="9" fill="#ffdbd1">
            1.150 / 1.200 (95.8%)
          </text>

          <rect x="60" y="94" width="200" height="46" rx="6" fill="#4c00da" fillOpacity="0.85" />
          <text x="160" y="114" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="700" fill="#ffffff">
            CANCHA GENERAL
          </text>
          <text x="160" y="128" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="9" fill="#cbbeff">
            2.200 / 2.800 (78.5%)
          </text>

          <path d="M 20 45 C 20 110, 40 160, 80 185" fill="none" stroke="#6534f5" strokeWidth="14" strokeLinecap="round" />
          <path d="M 300 45 C 300 110, 280 160, 240 185" fill="none" stroke="#6534f5" strokeWidth="14" strokeLinecap="round" />
          <path d="M 95 195 Q 160 215 225 195" fill="none" stroke="#797488" strokeWidth="16" strokeLinecap="round" />

          <text x="35" y="105" fontFamily="Plus Jakarta Sans" fontSize="8" fontWeight="700" fill="#6534f5" transform="rotate(-75 35,105)">
            P. PREFERENCIAL
          </text>
          <text x="285" y="105" fontFamily="Plus Jakarta Sans" fontSize="8" fontWeight="700" fill="#6534f5" transform="rotate(75 285,105)">
            P. GENERAL
          </text>
          <text x="160" y="206" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="9" fontWeight="700" fill="#ffffff">
            TRIBUNA
          </text>
        </svg>
        <div className={styles.liveTag}>
          <span className={styles.liveDot} />
          Mapa dinámico 3D
        </div>
      </div>

      <div className={styles.ledger}>
        {venueLedger.map((item) => (
          <div key={item.label} className={styles.ledgerRow}>
            <span className={styles.ledgerLabel}>
              <span className={styles.ledgerSwatch} style={{ background: item.color }} />
              {item.label}
            </span>
            <span className={styles.ledgerValue}>{item.value}</span>
          </div>
        ))}
      </div>

      <button type="button" className={styles.expandButton}>
        <MaterialIcon name="fullscreen" className={styles.expandIcon} />
        <span>Expandir Plano &amp; Asignación de Butacas</span>
      </button>
    </div>
  );
}
