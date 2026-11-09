"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Select.module.css";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  disabled?: boolean;
  /** Accessible name when there is no <label htmlFor={id}>. */
  "aria-label"?: string;
  /** Red border for a field that failed validation. */
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  /** Shown when `value` matches no option. */
  placeholder?: string;
  /** Optional icon on the left of the trigger. */
  icon?: ReactNode;
  /** sm: toolbars and side panels · md: filters · lg: forms, to match 44px inputs. */
  size?: "sm" | "md" | "lg";
  /** "full" fills its container (forms); "auto" fits the text (toolbars). */
  width?: "full" | "auto";
  className?: string;
};

type Position = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

const GAP = 6;
const MAX_LIST = 300;

/**
 * Drop-in replacement for <select> with the admin's own dropdown, so the open
 * list matches the panel instead of the browser's native menu.
 */
export default function Select({
  value,
  onChange,
  options,
  id,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  placeholder = "Selecciona…",
  icon,
  size = "md",
  width = "full",
  className,
}: Props) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<Position | null>(null);
  const typed = useRef({ text: "", at: 0 });
  // Center the chosen option when the list opens; afterwards keep it in view.
  const centerNext = useRef(false);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const openList = () => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled));
    centerNext.current = true;
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    close();
    if (option.value !== value) onChange(option.value);
  };

  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) {
      if (!options[i].disabled) return i;
    }
    return from;
  };

  // Place the list under the trigger (or above when there's no room), in a
  // portal so scrolling panels and overflow:hidden cards can't clip it.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - GAP - 8;
    const above = r.top - GAP - 8;
    const width = Math.max(r.width, 180);
    const left = Math.min(r.left, window.innerWidth - width - 8);
    if (below >= Math.min(MAX_LIST, 160) || below >= above) {
      setPos({ left, width, top: r.bottom + GAP, maxHeight: Math.min(MAX_LIST, below) });
    } else {
      setPos({ left, width, bottom: window.innerHeight - r.top + GAP, maxHeight: Math.min(MAX_LIST, above) });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus({ preventScroll: true });
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!listRef.current?.contains(t) && !triggerRef.current?.contains(t)) close(false);
    };
    // The list is fixed-positioned, so it would drift away from the trigger.
    const onScroll = (e: Event) => {
      if (!listRef.current?.contains(e.target as Node)) close(false);
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

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: centerNext.current ? "center" : "nearest" });
    centerNext.current = false;
  }, [open, active, pos]);

  const typeAhead = (key: string) => {
    const now = Date.now();
    typed.current.text = now - typed.current.at > 600 ? key : typed.current.text + key;
    typed.current.at = now;
    const q = typed.current.text.toLowerCase();
    const start = open ? active : selectedIndex;
    const order = [...options.keys()].map((i) => (i + start + (typed.current.text.length === 1 ? 1 : 0)) % options.length);
    const hit = order.find((i) => !options[i].disabled && options[i].label.toLowerCase().startsWith(q));
    if (hit === undefined) return;
    if (open) setActive(hit);
    else if (options[hit].value !== value) onChange(options[hit].value);
  };

  // Keys typed in the select belong to it, as with a native <select>: the
  // venue/seat editors listen on window for Delete, arrows and letter
  // shortcuts, and dialogs listen on document for Escape. Tab still travels.
  const isolate = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") return;
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    isolate(e);
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openList();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      typeAhead(e.key);
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    isolate(e);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => step(a, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => step(a, -1));
        break;
      case "Home":
        e.preventDefault();
        setActive(step(-1, 1));
        break;
      case "End":
        e.preventDefault();
        setActive(step(options.length, -1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        // Back on the trigger, so Tab moves on from where the select sits
        // (and focus traps in dialogs keep working).
        close();
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeAhead(e.key);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={`${styles.trigger} ${size === "sm" ? styles.sm : size === "lg" ? styles.lg : ""} ${width === "auto" ? styles.auto : ""} ${icon ? styles.withIcon : ""} ${open ? styles.open : ""} ${className ?? ""}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        data-invalid={ariaInvalid || undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKey}
      >
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={`${styles.value} ${selected ? "" : styles.placeholder}`}>{selected?.label ?? placeholder}</span>
        <svg className={styles.chevron} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m5.5 7.75 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            className={styles.list}
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            aria-label={ariaLabel}
            onKeyDown={onListKey}
          >
            {options.map((o, i) => (
              <li
                key={`${o.value}-${i}`}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={o.value === value}
                aria-disabled={o.disabled || undefined}
                className={`${styles.option} ${i === active ? styles.active : ""} ${o.value === value ? styles.selected : ""} ${o.disabled ? styles.disabled : ""}`}
                onPointerMove={() => !o.disabled && i !== active && setActive(i)}
                onClick={() => choose(i)}
              >
                <span className={styles.optionLabel}>{o.label}</span>
                {o.value === value && (
                  <svg className={styles.check} viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="m4.5 10.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </>
  );
}
