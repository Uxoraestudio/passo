"use client";

import { CalendarSmallIcon, ChevronDownIcon } from "@/components/icons";
import { periodOptions, type Period } from "@/lib/admin-data";
import styles from "./PeriodSelect.module.css";

export default function PeriodSelect({ value, onChange }: { value: Period; onChange: (period: Period) => void }) {
  return (
    <label className={styles.select}>
      <CalendarSmallIcon className={styles.icon} />
      <span className="sr-only">Período</span>
      <select value={value} onChange={(e) => onChange(e.target.value as Period)}>
        {periodOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className={styles.chevron} />
    </label>
  );
}
