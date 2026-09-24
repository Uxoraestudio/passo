"use client";

import { MaterialIcon } from "@/components/icons";
import { periodOptions, eventFilterOptions, paymentMethodOptions, statusFilterOptions } from "@/lib/sales-data";
import styles from "./SalesFilterBar.module.css";

export default function SalesFilterBar() {
  return (
    <div className={styles.card}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>Período Temporal</span>
          <span className={styles.selectWrap}>
            <MaterialIcon name="calendar_today" className={styles.fieldIcon} />
            <select className={styles.select} defaultValue={periodOptions[0]}>
              {periodOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <MaterialIcon name="expand_more" className={styles.chevronIcon} />
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Evento Seleccionado</span>
          <span className={styles.selectWrap}>
            <MaterialIcon name="festival" className={styles.fieldIcon} />
            <select className={styles.select} defaultValue={eventFilterOptions[0]}>
              {eventFilterOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <MaterialIcon name="expand_more" className={styles.chevronIcon} />
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Método de Pago</span>
          <span className={styles.selectWrap}>
            <MaterialIcon name="credit_card" className={styles.fieldIcon} />
            <select className={styles.select} defaultValue={paymentMethodOptions[0]}>
              {paymentMethodOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <MaterialIcon name="expand_more" className={styles.chevronIcon} />
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Estado de Transacción</span>
          <span className={styles.selectWrap}>
            <MaterialIcon name="tune" className={styles.fieldIcon} />
            <select className={styles.select} defaultValue={statusFilterOptions[0]}>
              {statusFilterOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <MaterialIcon name="expand_more" className={styles.chevronIcon} />
          </span>
        </label>
      </div>
    </div>
  );
}
