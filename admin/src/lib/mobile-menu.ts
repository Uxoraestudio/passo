"use client";

import { useSyncExternalStore } from "react";

// Open/closed state of the side menu on small screens, shared by the top bar
// (which opens it) and the sidebar (which shows it as a sliding panel).

let open = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (open === value) return;
  open = value;
  listeners.forEach((l) => l());
}

export const openMobileMenu = () => set(true);
export const closeMobileMenu = () => set(false);

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useMobileMenu() {
  return useSyncExternalStore(subscribe, () => open, () => false);
}
