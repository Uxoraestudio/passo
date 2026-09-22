import { MaterialIcon } from "@/components/icons";
import { sectorRows } from "@/lib/tickets-management-data";
import styles from "./SectorsTable.module.css";

export default function SectorsTable() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Sectores, Aforos y Recargo</h2>
          <p className={styles.subtitle}>Configuración de inventario por zona de acceso en Movistar Arena.</p>
        </div>
        <button type="button" className={styles.addButton}>
          <MaterialIcon name="add_circle" className={styles.addIcon} />
          <span>Añadir nuevo sector</span>
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Sector / Ubicación</th>
              <th>Capacidad</th>
              <th>Vendidas</th>
              <th>Precio Base</th>
              <th>Cargo Serv.</th>
              <th>Estado</th>
              <th className={styles.actionsHead}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sectorRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className={styles.sectorCell}>
                    <span className={styles.dot} style={{ background: row.dotColor }} />
                    <div>
                      <span className={styles.sectorName}>{row.name}</span>
                      <span className={styles.sectorLocation} data-tone={row.locationTone}>
                        {row.location}
                      </span>
                    </div>
                  </div>
                </td>
                <td className={styles.strong}>{row.capacity}</td>
                <td>
                  <span className={styles.strong}>{row.sold}</span>
                  <span className={styles.soldPercent} data-tone={row.soldTone}>
                    {row.soldPercent}
                  </span>
                </td>
                <td className={styles.strong}>{row.priceBase}</td>
                <td className={styles.muted}>{row.serviceFee}</td>
                <td>
                  <span className={styles.statusPill}>{row.status}</span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" className={styles.actionButton} title="Ajustar cupo">
                      <MaterialIcon name="tune" className={styles.actionIcon} />
                    </button>
                    <button type="button" className={styles.actionButton} data-danger title="Pausar venta de sector">
                      <MaterialIcon name="pause" className={styles.actionIcon} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <span>* Cargos de servicio aplican automáticamente en pasarelas Transbank y MercadoPago.</span>
        <button type="button" className={styles.csvButton}>
          Descargar Manifiesto de Ventas (CSV)
        </button>
      </div>
    </div>
  );
}
