"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { MaterialIcon } from "@/components/icons";
import styles from "./EventFormPage.module.css";

export type DialogAction = {
  label: string;
  variant: "primary" | "soft" | "danger";
  onClick: () => void;
  autoFocus?: boolean;
  busyLabel?: string;
};

const variantClass = {
  primary: styles.btnOrange,
  soft: styles.btnSoft,
  danger: styles.btnDanger,
};

export default function ConfirmDialog({
  open,
  icon = "warning",
  title,
  children,
  details,
  actions,
  busy = false,
  kind = "alert",
  wide = false,
  onClose,
}: {
  open: boolean;
  icon?: string;
  title: string;
  children: ReactNode;
  details?: string[];
  actions: DialogAction[];
  busy?: boolean;
  /** "form" dialogs hold inputs and use role="dialog" instead of "alertdialog". */
  kind?: "alert" | "form";
  wide?: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);

  useEffect(() => {
    onCloseRef.current = onClose;
    busyRef.current = busy;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!busyRef.current) onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div ref={dialogRef} className={styles.modal} data-wide={wide} role={kind === "form" ? "dialog" : "alertdialog"} aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} aria-busy={busy}>
        <div className={styles.modalIcon} aria-hidden="true">
          <MaterialIcon decorative name={icon} />
        </div>
        <h3 id={titleId}>{title}</h3>
        <div id={descId} className={styles.modalBody}>
          {children}
          {details && details.length > 0 && (
            <ul>
              {details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.modalActions}>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              className={`${styles.btn} ${variantClass[a.variant]}`}
              onClick={a.onClick}
              disabled={busy}
              data-autofocus={a.autoFocus ? "" : undefined}
            >
              {busy && a.busyLabel ? a.busyLabel : a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
