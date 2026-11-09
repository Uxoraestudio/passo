"use client";

import Select from "@/components/Select";
import { CalendarSmallIcon } from "@/components/icons";
import { periodOptions, type Period } from "@/lib/admin-data";

export default function PeriodSelect({ value, onChange }: { value: Period; onChange: (period: Period) => void }) {
  return (
    <Select
      size="sm"
      width="auto"
      aria-label="Período"
      icon={<CalendarSmallIcon />}
      value={value}
      onChange={(v) => onChange(v as Period)}
      options={periodOptions.map((o) => ({ value: o.id, label: o.label }))}
    />
  );
}
