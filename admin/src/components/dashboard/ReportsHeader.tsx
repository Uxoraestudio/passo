"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import styles from "./ReportsHeader.module.css";

type ButtonState = "idle" | "loading" | "done";

export default function ReportsHeader() {
  const [excelState, setExcelState] = useState<ButtonState>("idle");
  const [pdfState, setPdfState] = useState<ButtonState>("idle");

  const runSequence = (setState: (state: ButtonState) => void, loadingMs: number, doneMs: number) => {
    setState("loading");
    setTimeout(() => {
      setState("done");
      setTimeout(() => setState("idle"), doneMs);
    }, loadingMs);
  };

  return (
    <section className={styles.section}>
      <div>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            MÓDULO DE INTELIGENCIA DE NEGOCIO EN VIVO
          </span>
          <span className={styles.versionCaption}>v4.8 • Auditoría AFORIQ Passo</span>
        </div>
        <h1 className={styles.title}>Reportes y Analítica de Rendimiento</h1>
        <p className={styles.subtitle}>
          Informes consolidados de recaudación, dispersión de tickets, embudo de conversión y liquidaciones operativas en recintos.
        </p>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={() => runSequence(setExcelState, 900, 2000)}>
          {excelState === "idle" ? (
            <>
              <MaterialIcon name="table_view" className={styles.secondaryIcon} />
              <span>Exportar Métricas (Excel)</span>
            </>
          ) : excelState === "loading" ? (
            <>
              <MaterialIcon name="sync" className={styles.spinIcon} />
              <span>Generando .XLSX...</span>
            </>
          ) : (
            <>
              <MaterialIcon name="check_circle" className={styles.secondaryIcon} />
              <span>Archivo Listo</span>
            </>
          )}
        </button>
        <button type="button" className={styles.primaryButton} onClick={() => runSequence(setPdfState, 1100, 2400)}>
          {pdfState === "idle" ? (
            <>
              <MaterialIcon name="picture_as_pdf" className={styles.primaryIcon} />
              <span>Descargar Liquidación Oficial (PDF)</span>
            </>
          ) : pdfState === "loading" ? (
            <>
              <MaterialIcon name="progress_activity" className={styles.spinIcon} />
              <span>Compilando Liquidación...</span>
            </>
          ) : (
            <>
              <MaterialIcon name="done" className={styles.primaryIcon} />
              <span>Descargado con Éxito</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
