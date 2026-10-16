"use client";

import { useRef, useState, type FormEvent } from "react";
import { MaterialIcon } from "@/components/icons";
import { useQrScanner, type ScannerState } from "./useQrScanner";
import styles from "./ValidatorConsole.module.css";

const cameraText: Record<ScannerState, string> = {
  idle: "Activa la cámara para escanear",
  starting: "Abriendo la cámara…",
  scanning: "Centra el QR en el visor, a unos 25 cm del teléfono",
  denied: "El navegador bloqueó la cámara. Permítela en la configuración del sitio o usa el ingreso manual.",
  unavailable: "Este dispositivo no tiene cámara disponible. Usa un lector o el ingreso manual.",
};

/**
 * Where the operator scans: the device camera, or a USB/Bluetooth reader that
 * types the code followed by Enter (it lands in the manual field, which keeps
 * the focus), or the short code typed by hand.
 */
export default function ValidatorConsole({
  gate,
  onGate,
  busy,
  disabled,
  onCode,
}: {
  gate: string;
  onGate: (gate: string) => void;
  busy: boolean;
  disabled: boolean;
  onCode: (code: string) => void;
}) {
  const [device, setDevice] = useState<"camera" | "scanner">("scanner");
  const [cameraOn, setCameraOn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanner = useQrScanner(videoRef, device === "camera" && cameraOn && !disabled, busy, onCode);
  const camera = scanner.state;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const code = manualCode.trim();
    if (!code || busy || disabled) return;
    onCode(code);
    setManualCode("");
    inputRef.current?.focus();
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Consola del Validador</h2>
        <span className={styles.autoscanBadge} data-on={device === "camera" ? camera === "scanning" : true}>
          <span className={styles.autoscanDot} />
          {device === "camera" ? (camera === "scanning" ? "Cámara activa" : "Cámara apagada") : "Lector listo"}
        </span>
      </div>

      <div className={styles.deviceRow} role="radiogroup" aria-label="Cómo escanear">
        <button type="button" role="radio" aria-checked={device === "camera"} className={styles.deviceButton} data-active={device === "camera"} onClick={() => setDevice("camera")}>
          <MaterialIcon name="photo_camera" className={styles.deviceIcon} />
          <span>Cámara</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={device === "scanner"}
          className={styles.deviceButton}
          data-active={device === "scanner"}
          onClick={() => {
            setDevice("scanner");
            setCameraOn(false);
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <MaterialIcon name="barcode_reader" className={styles.deviceIcon} />
          <span>Lector o teclado</span>
        </button>
      </div>

      {device === "camera" && (
        <div className={styles.viewfinder}>
          <div className={styles.cameraFrame} data-on={camera === "scanning"}>
            <video ref={videoRef} className={styles.video} muted playsInline aria-label="Vista de la cámara" />
            <span className={styles.corner} data-pos="tl" />
            <span className={styles.corner} data-pos="tr" />
            <span className={styles.corner} data-pos="bl" />
            <span className={styles.corner} data-pos="br" />
            {camera !== "scanning" && <MaterialIcon name="qr_code_scanner" className={styles.viewfinderIcon} />}
          </div>
          <p className={styles.viewfinderLabel} aria-live="polite">
            {busy ? "Validando…" : cameraText[camera]}
          </p>
          {camera === "scanning" && scanner.zoomRange && (
            <label className={styles.zoomField}>
              <span>Zoom {scanner.zoom.toLocaleString("es-CL", { maximumFractionDigits: 1 })}×</span>
              <input
                type="range"
                min={scanner.zoomRange.min}
                max={scanner.zoomRange.max}
                step={scanner.zoomRange.step}
                value={scanner.zoom}
                onChange={(e) => scanner.setZoom(Number(e.target.value))}
                aria-label="Zoom de la cámara"
              />
            </label>
          )}
          {camera === "scanning" && <p className={styles.cameraTip}>Si se ve borroso, aleja un poco el teléfono: la cámara no enfoca muy de cerca.</p>}
          {!cameraOn ? (
            <button type="button" className={styles.cameraButton} onClick={() => setCameraOn(true)} disabled={disabled}>
              <MaterialIcon name="videocam" className={styles.validateIcon} />
              Activar cámara
            </button>
          ) : (
            <button type="button" className={styles.cameraButtonGhost} onClick={() => setCameraOn(false)}>
              Apagar cámara
            </button>
          )}
        </div>
      )}

      <form className={styles.manualForm} onSubmit={submit}>
        <label className={styles.manualLabel} htmlFor="manual-code">
          {device === "scanner" ? "Escanea con el lector o escribe el código" : "Ingreso manual"}
        </label>
        <div className={styles.manualRow}>
          <input
            ref={inputRef}
            id="manual-code"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
            className={styles.manualInput}
            placeholder="Ej: PS-95B3307B5B-01"
            value={manualCode}
            disabled={disabled}
            onChange={(event) => setManualCode(event.target.value)}
          />
          <button type="submit" className={styles.validateButton} disabled={busy || disabled || !manualCode.trim()}>
            <span>{busy ? "Validando…" : "Validar"}</span>
            <MaterialIcon name="arrow_forward" className={styles.validateIcon} />
          </button>
        </div>
        <p className={styles.manualHint}>El código corto aparece bajo el QR de cada entrada impresa.</p>
      </form>

      <label className={styles.gateField}>
        <span className={styles.manualLabel}>Puerta o acceso</span>
        <input className={styles.manualInput} value={gate} maxLength={40} placeholder="Ej: Puerta Norte" onChange={(e) => onGate(e.target.value)} />
        <small className={styles.manualHint}>Queda registrada en cada ingreso para ver el flujo por acceso.</small>
      </label>
    </div>
  );
}
