import { useEffect, useState } from "react";

/** `value`, but only after it stopped changing for `ms` (e.g. the zoom once the user is done zooming). */
export function useSettled<T>(value: T, ms = 160): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return settled;
}
