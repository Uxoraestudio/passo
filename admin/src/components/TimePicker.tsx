"use client";

import Select from "./Select";
import DatePicker from "./DatePicker";
import styles from "./DatePicker.module.css";

const STEP = 15;
const BASE = Array.from({ length: (24 * 60) / STEP }, (_, i) => {
  const m = i * STEP;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

const clockIcon = (
  <svg viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
    <path d="M10 6.5V10l2.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type TimeProps = {
  /** "HH:mm", or "" when empty — the same value an <input type="time"> uses. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  placeholder?: string;
  /** Adds "Sin hora" at the top so an optional time can be cleared. */
  clearable?: boolean;
  size?: "sm" | "md" | "lg";
};

/**
 * Time field as a list every 15 minutes, with the admin's dropdown. Typing
 * "21" jumps to 21:00. A saved time off the 15-minute grid (e.g. 20:10) is
 * kept and listed in its place.
 */
export function TimePicker({ value, clearable = false, placeholder = "Elige la hora", size = "lg", ...rest }: TimeProps) {
  const time = value.slice(0, 5);
  const times = time && !BASE.includes(time) ? [...BASE, time].sort() : BASE;
  const options = [...(clearable ? [{ value: "", label: "Sin hora" }] : []), ...times.map((t) => ({ value: t, label: t }))];
  return <Select {...rest} value={time} options={options} placeholder={placeholder} icon={clockIcon} size={size} />;
}

type DateTimeProps = {
  /** "yyyy-mm-ddTHH:mm", or "" — the same value an <input type="datetime-local"> uses. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  /** Names both parts for screen readers, e.g. "Inicio de venta". */
  "aria-label"?: string;
  "aria-describedby"?: string;
  /** Time used when a date is picked before a time. */
  defaultTime?: string;
};

/** Date and time side by side, for what used to be <input type="datetime-local">. */
export function DateTimeField({ value, onChange, id, disabled, "aria-label": label, "aria-describedby": describedBy, defaultTime = "00:00" }: DateTimeProps) {
  const [date = "", time = ""] = value.split("T");
  const onDate = (d: string) => onChange(d ? `${d}T${time.slice(0, 5) || defaultTime}` : "");
  const onTime = (t: string) => {
    const d = date || new Date().toLocaleDateString("sv-SE"); // sv-SE gives yyyy-mm-dd in local time
    onChange(`${d}T${t}`);
  };
  return (
    <div className={styles.dateTime}>
      <DatePicker id={id} value={date} onChange={onDate} disabled={disabled} aria-label={label ? `${label}, fecha` : undefined} aria-describedby={describedBy} />
      <TimePicker value={time} onChange={onTime} disabled={disabled || !date} placeholder="Hora" aria-label={label ? `${label}, hora` : "Hora"} aria-describedby={describedBy} />
    </div>
  );
}
