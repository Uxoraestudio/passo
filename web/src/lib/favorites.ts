"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "passo:favorites";

function readStoredFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  // Initial state matches SSR ([]) so hydration never mismatches; the real
  // value is synced from localStorage right after mount, which is a normal
  // post-hydration update, not a hydration diff.
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage on mount, client-only data source
    setFavorites(readStoredFavorites());
  }, []);

  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable (private mode, etc.) — keep in-memory only
    }
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, isFavorite, toggleFavorite };
}
