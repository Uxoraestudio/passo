"use client";

import { useEffect } from "react";
import styles from "./page.module.css";

/** With `auto`, opens the print dialog once the page (and its fonts) are ready; the button opens it any time. */
export default function PrintNow({ auto }: { auto: boolean }) {
  useEffect(() => {
    if (!auto) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) window.setTimeout(() => window.print(), 300);
    });
    return () => {
      cancelled = true;
    };
  }, [auto]);

  return (
    <button type="button" className={styles.printButton} onClick={() => window.print()}>
      Imprimir o guardar PDF
    </button>
  );
}
