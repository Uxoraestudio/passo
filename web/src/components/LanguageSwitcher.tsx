"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LanguageSwitcher.module.css";

type Language = { code: string; label: string; flag: string };

const languages: Language[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "Inglés", flag: "🇺🇸" },
  { code: "pt", label: "Portugués", flag: "🇧🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(languages[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.flag}>{selected.flag}</span>
        <span className={styles.code}>{selected.code.toUpperCase()}</span>
        <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" aria-hidden="true" data-open={open}>
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox" aria-label="Selecciona un idioma">
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              role="option"
              aria-selected={selected.code === language.code}
              className={styles.option}
              data-active={selected.code === language.code}
              onClick={() => {
                setSelected(language);
                setOpen(false);
              }}
            >
              <span className={styles.flag}>{language.flag}</span>
              <span className={styles.optionLabel}>{language.label}</span>
              {selected.code === language.code && (
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={styles.check}>
                  <path d="M16.667 5 7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
