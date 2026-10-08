"use client";

import { useState } from "react";
import styles from "./Confirmed.module.css";

export function CopyOrderCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" className={styles.orderCode} onClick={copy} aria-label={`Copiar código de orden ${code}`}>
      Código de orden: <strong>{code}</strong>
      <span className={styles.copyState} aria-live="polite">
        {copied ? (
          "Copiado"
        ) : (
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M3 10.5V3.5A1 1 0 0 1 4 2.5h6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function PrintTicketsButton() {
  return (
    <button type="button" className={styles.downloadButton} onClick={() => window.print()}>
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3.5v9m0 0-3.5-3.5M10 12.5l3.5-3.5M4 15.5h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Descargar entradas
    </button>
  );
}
