"use client";

import { useState, type FormEvent } from "react";
import { MaterialIcon } from "@/components/icons";
import styles from "./ValidatorConsole.module.css";

export default function ValidatorConsole() {
  const [inputDevice, setInputDevice] = useState<"camera" | "scanner">("camera");
  const [offlineMode, setOfflineMode] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleValidate = (event: FormEvent) => {
    event.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    setFeedback(`Validando ${code}…`);
    setManualCode("");
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Consola del Validador</h2>
        <span className={styles.autoscanBadge}>
          <span className={styles.autoscanDot} />
          AUTOSCAN ON
        </span>
      </div>

      <div className={styles.viewfinder}>
        <div className={styles.viewfinderFrame}>
          <span className={styles.corner} data-pos="tl" />
          <span className={styles.corner} data-pos="tr" />
          <span className={styles.corner} data-pos="bl" />
          <span className={styles.corner} data-pos="br" />
          <MaterialIcon name="qr_code_scanner" className={styles.viewfinderIcon} />
        </div>
        <p className={styles.viewfinderLabel}>Alinee el código QR en el visor</p>
        <p className={styles.viewfinderCaption}>Compatible con PDF, Wallet y Pulseras NFC</p>
      </div>

      <div className={styles.deviceRow}>
        <button
          type="button"
          className={styles.deviceButton}
          data-active={inputDevice === "camera"}
          onClick={() => setInputDevice("camera")}
        >
          <MaterialIcon name="photo_camera" className={styles.deviceIcon} />
          <span>Cámara Web</span>
        </button>
        <button
          type="button"
          className={styles.deviceButton}
          data-active={inputDevice === "scanner"}
          onClick={() => setInputDevice("scanner")}
        >
          <MaterialIcon name="barcode_reader" className={styles.deviceIcon} />
          <span>Pistola Láser HID</span>
        </button>
      </div>

      <form className={styles.manualForm} onSubmit={handleValidate}>
        <label className={styles.manualLabel} htmlFor="manual-code">
          Búsqueda / Ingreso Manual
        </label>
        <div className={styles.manualRow}>
          <input
            id="manual-code"
            type="text"
            className={styles.manualInput}
            placeholder="Ej: 19.492.301-4 o TKT-8902…"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
          />
          <button type="submit" className={styles.validateButton}>
            <span>Validar</span>
            <MaterialIcon name="arrow_forward" className={styles.validateIcon} />
          </button>
        </div>
        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      </form>

      <div className={styles.offlineRow}>
        <span className={styles.offlineIconBox}>
          <MaterialIcon name="sync" className={styles.offlineIcon} />
        </span>
        <div className={styles.offlineText}>
          <span className={styles.offlineLabel}>Modo Offline Local</span>
          <span className={styles.offlineCaption}>Base de datos sincronizada • 6.482 claves hash</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={offlineMode}
          aria-label="Modo Offline Local"
          className={styles.switch}
          data-checked={offlineMode}
          onClick={() => setOfflineMode((prev) => !prev)}
        >
          <span className={styles.switchThumb} />
        </button>
      </div>
    </div>
  );
}
