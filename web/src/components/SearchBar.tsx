"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { eventHref, searchEvents } from "@/lib/events";
import styles from "./SearchBar.module.css";

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [queryForActiveIndex, setQueryForActiveIndex] = useState(query);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => searchEvents(query).slice(0, 5), [query]);

  if (query !== queryForActiveIndex) {
    setQueryForActiveIndex(query);
    setActiveIndex(-1);
  }

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const runSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/eventos?q=${encodeURIComponent(trimmed)}`);
  };

  const goToResult = (index: number) => {
    const result = results[index];
    if (!result) return;
    setOpen(false);
    inputRef.current?.blur();
    router.push(eventHref(result));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        goToResult(activeIndex);
      } else {
        runSearch();
      }
    }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div className={styles.container} data-compact={compact} ref={containerRef}>
      <div className={styles.search} data-focused={open}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          placeholder="Busca artistas, eventos o ciudades"
          className={styles.searchInput}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button type="button" className={styles.searchButton} aria-label="Buscar" onClick={runSearch}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2.2" />
            <path d="M21 21L16.6501 16.6501" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {showDropdown && (
        <div className={styles.dropdown} role="listbox" id={listId} aria-label="Sugerencias de búsqueda">
          {results.length === 0 ? (
            <p className={styles.empty} role="status" aria-live="polite">
              Sin resultados para tu búsqueda
            </p>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                id={`${listId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={styles.suggestion}
                data-active={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => goToResult(index)}
              >
                <span className={styles.suggestionTitle}>{result.title}</span>
                <span className={styles.suggestionMeta}>
                  {result.venue} · {result.city}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
