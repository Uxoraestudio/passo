"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES, categoryHref } from "@/lib/categories";
import styles from "./CategoriesMenu.module.css";

const ALL_HREF = "/eventos/";

export default function CategoriesMenu({ compact = false, scrolled = false }: { compact?: boolean; scrolled?: boolean }) {
  const [open, setOpen] = useState(false);
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
    <div className={styles.container} data-compact={compact} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        data-compact={compact}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Categorías"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        {!compact && "Categorías"}
        <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" aria-hidden="true" data-open={open}>
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown} data-scrolled={scrolled} role="menu" aria-label="Categorías de eventos">
          <Link href={ALL_HREF} className={styles.option} role="menuitem" onClick={() => setOpen(false)}>
            Todos
          </Link>
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={categoryHref(category)}
              className={styles.option}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {category.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
