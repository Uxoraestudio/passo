"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { periodTabs, reportEventOptions } from "@/lib/reports-data";
import styles from "./ReportsFilterBar.module.css";

export default function ReportsFilterBar() {
  const [activePeriod, setActivePeriod] = useState(periodTabs[0]);

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.tabGroup}>
          {periodTabs.map((tab) => (
            <button key={tab} type="button" className={styles.tabButton} data-active={tab === activePeriod} onClick={() => setActivePeriod(tab)}>
              {tab}
            </button>
          ))}
        </div>
        <span className={styles.selectWrap}>
          <MaterialIcon name="stadium" className={styles.selectIcon} />
          <select className={styles.select} defaultValue={reportEventOptions[0].value}>
            {reportEventOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <MaterialIcon name="expand_more" className={styles.chevronIcon} />
        </span>
      </div>

      <div className={styles.right}>
        <span className={styles.reconciliationNote}>
          <MaterialIcon name="verified_user" className={styles.reconciliationIcon} />
          Conciliación Bancaria al 100% (Transbank / Webpay Plus)
        </span>
        <span className={styles.divider} />
        <button type="button" className={styles.filtersButton}>
          <MaterialIcon name="tune" className={styles.filtersIcon} />
          <span>Filtros Avanzados</span>
        </button>
      </div>
    </div>
  );
}
