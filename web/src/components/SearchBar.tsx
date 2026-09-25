"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { eventHref, searchEvents } from "@/lib/events";
import styles from "./SearchBar.module.css";

export default function SearchBar() {
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
    <div className={styles.container} ref={containerRef}>
      <div className={styles.search} data-focused={open}>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M14 14L11.1 11.1M11.1 7.33333C11.1 9.41221 9.41221 11.1 7.33333 11.1C5.25445 11.1 3.56667 9.41221 3.56667 7.33333C3.56667 5.25445 5.25445 3.56667 7.33333 3.56667C9.41221 3.56667 11.1 5.25445 11.1 7.33333L14 14"
            stroke="#9CA3AF"
            strokeWidth="1.46667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M13.3333 5.83333C13.3333 7.67305 11.8397 9.16667 10 9.16667C8.16028 9.16667 6.66667 7.67305 6.66667 5.83333C6.66667 3.99362 8.16028 2.5 10 2.5C11.8397 2.5 13.3333 3.99362 13.3333 5.83333V5.83333M10 11.6667C6.7805 11.6667 4.16667 14.2805 4.16667 17.5H15.8333C15.8333 14.2805 13.2195 11.6667 10 11.6667V11.6667"
              stroke="white"
              strokeWidth="1.83333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
