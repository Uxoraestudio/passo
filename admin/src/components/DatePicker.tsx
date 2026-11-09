"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import selectStyles from "./Select.module.css";
import styles from "./DatePicker.module.css";

type Props = {
  /** "yyyy-mm-dd", or "" when empty — the same value an <input type="date"> uses. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  placeholder?: string;
  /** Shows "Borrar" in the calendar. Off for required fields. */
  clearable?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const WEEKDAYS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const pad = (n: number) => String(n).padStart(2, "0");
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};
const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && toIsoDate(a) === toIsoDate(b);

const SHORT_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
/** "Sáb 14 nov 2026" */
const shortLabel = (d: Date) => `${SHORT_DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
const fullFormat = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** 6 weeks starting on the Monday on or before the 1st of the month. */
function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

type Position = { left: number; top?: number; bottom?: number };
const GAP = 6;
const PANEL_W = 300;
const PANEL_H = 360;

/** Date field with the admin's own calendar, in place of the browser's. */
export default function DatePicker({
  value,
  onChange,
  id,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  placeholder = "Elige una fecha",
  clearable = true,
  size = "lg",
  className,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<Date>(() => new Date());
  const [pos, setPos] = useState<Position | null>(null);
  // Move focus to the focused day only on open and when using the keyboard in
  // the grid, so the month arrows keep focus while you click through months.
  const focusDay = useRef(false);

  const selected = parseIsoDate(value);
  const today = new Date();

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const openPanel = () => {
    if (disabled) return;
    setFocused(selected ?? new Date());
    focusDay.current = true;
    setOpen(true);
  };

  const choose = (d: Date | null) => {
    close();
    const next = d ? toIsoDate(d) : "";
    if (next !== value) onChange(next);
  };

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - PANEL_W - 8));
    const below = window.innerHeight - r.bottom - GAP;
    if (below >= PANEL_H || below >= r.top) setPos({ left, top: r.bottom + GAP });
    else setPos({ left, bottom: window.innerHeight - r.top + GAP });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !triggerRef.current?.contains(t)) close(false);
    };
    const onScroll = (e: Event) => {
      if (!panelRef.current?.contains(e.target as Node)) close(false);
    };
    const onResize = () => close(false);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  // Keep keyboard focus on the focused day (roving tabindex).
  useEffect(() => {
    if (!open || !pos || !focusDay.current) return;
    panelRef.current?.querySelector<HTMLElement>(`[data-day="${toIsoDate(focused)}"]`)?.focus({ preventScroll: true });
  }, [open, pos, focused]);

  // Keys belong to the calendar, as in Select: editors and dialogs listen on window/document.
  const isolate = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") return;
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    isolate(e);
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openPanel();
    } else if ((e.key === "Delete" || e.key === "Backspace") && clearable && value) {
      e.preventDefault();
      onChange("");
    }
  };

  const onGridKey = (e: React.KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -((focused.getDay() + 6) % 7)),
      End: () => addDays(focused, 6 - ((focused.getDay() + 6) % 7)),
      PageUp: () => addMonths(focused, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, e.shiftKey ? 12 : 1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      focusDay.current = true;
      setFocused(moves[e.key]());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(focused);
    }
  };

  const onPanelKey = (e: React.KeyboardEvent) => {
    isolate(e);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      // Keep Tab inside the calendar while it is open, like a small dialog.
      const items = [...(panelRef.current?.querySelectorAll<HTMLElement>("button:not([tabindex='-1'])") ?? [])];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length];
      e.preventDefault();
      next?.focus();
    }
  };

  const days = monthGrid(focused);
  const monthLabel = `${MONTHS[focused.getMonth()]} de ${focused.getFullYear()}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={`${selectStyles.trigger} ${size === "sm" ? selectStyles.sm : size === "lg" ? selectStyles.lg : ""} ${selectStyles.withIcon} ${open ? selectStyles.open : ""} ${className ?? ""}`}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        data-invalid={ariaInvalid || undefined}
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={onTriggerKey}
      >
        <span className={selectStyles.icon} aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3 8.5h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <span className={`${selectStyles.value} ${selected ? "" : selectStyles.placeholder}`}>
          {selected ? shortLabel(selected) : placeholder}
        </span>
        <svg className={selectStyles.chevron} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m5.5 7.75 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label={ariaLabel ? `${ariaLabel}: calendario` : "Calendario"}
            className={styles.panel}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: PANEL_W }}
            onKeyDown={onPanelKey}
          >
            <div className={styles.header}>
              <span className={styles.month} aria-live="polite">
                {monthLabel}
              </span>
              <div className={styles.nav}>
                <button type="button" className={styles.navButton} onClick={() => { focusDay.current = false; setFocused(addMonths(focused, -1)); }} aria-label="Mes anterior">
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="m12 5-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button type="button" className={styles.navButton} onClick={() => { focusDay.current = false; setFocused(addMonths(focused, 1)); }} aria-label="Mes siguiente">
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div role="grid" aria-label={monthLabel} className={styles.grid} onKeyDown={onGridKey}>
              <div role="row" className={styles.weekdays}>
                {WEEKDAYS.map((d) => (
                  <span key={d} role="columnheader" className={styles.weekday}>
                    {d}
                  </span>
                ))}
              </div>
              {[0, 1, 2, 3, 4, 5].map((w) => (
                <div role="row" key={w} className={styles.week}>
                  {days.slice(w * 7, w * 7 + 7).map((d) => {
                    const iso = toIsoDate(d);
                    const isSelected = sameDay(d, selected);
                    const isFocused = sameDay(d, focused);
                    return (
                      <span role="gridcell" key={iso} aria-selected={isSelected}>
                        <button
                          type="button"
                          data-day={iso}
                          tabIndex={isFocused ? 0 : -1}
                          className={styles.day}
                          data-outside={d.getMonth() !== focused.getMonth() || undefined}
                          data-today={sameDay(d, today) || undefined}
                          data-selected={isSelected || undefined}
                          aria-label={fullFormat.format(d)}
                          aria-current={sameDay(d, today) ? "date" : undefined}
                          onClick={() => choose(d)}
                        >
                          {d.getDate()}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              {clearable && value ? (
                <button type="button" className={styles.link} onClick={() => choose(null)}>
                  Borrar
                </button>
              ) : (
                <span />
              )}
              <button type="button" className={styles.link} onClick={() => choose(new Date())}>
                Hoy
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
