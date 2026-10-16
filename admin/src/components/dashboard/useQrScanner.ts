"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Reads QR codes from the device camera. Uses the browser's BarcodeDetector
// where it exists (Chrome, Android) and jsQR otherwise (Safari, iPhone).

type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };

export type ScannerState = "idle" | "starting" | "scanning" | "denied" | "unavailable";

/** The same code read again within this time is ignored (the QR stays in front of the camera). */
const REPEAT_MS = 4000;
const FRAME_MS = 180;

export function useQrScanner(videoRef: RefObject<HTMLVideoElement | null>, active: boolean, paused: boolean, onCode: (code: string) => void) {
  const [state, setState] = useState<ScannerState>("idle");
  const onCodeRef = useRef(onCode);
  const pausedRef = useRef(paused);
  useEffect(() => {
    onCodeRef.current = onCode;
    pausedRef.current = paused;
  });

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer = 0;
    const last = { code: "", at: 0 };
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unavailable");
        return;
      }
      setState("starting");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      } catch (e) {
        if (!stopped) setState(e instanceof DOMException && e.name === "NotAllowedError" ? "denied" : "unavailable");
        return;
      }
      const video = videoRef.current;
      if (stopped || !video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});

      const Native = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
      let detector: Detector | null = null;
      if (Native) {
        try {
          detector = new Native({ formats: ["qr_code"] });
        } catch {
          detector = null;
        }
      }
      const jsQR = detector ? null : (await import("jsqr")).default;
      setState("scanning");

      const tick = async () => {
        if (stopped) return;
        if (!pausedRef.current && video.readyState >= 2 && video.videoWidth > 0) {
          let code: string | null = null;
          try {
            if (detector) {
              code = (await detector.detect(video))[0]?.rawValue ?? null;
            } else if (jsQR && ctx) {
              // Decode a downscaled frame: plenty for a QR and much faster.
              const scale = Math.min(1, 640 / video.videoWidth);
              canvas.width = Math.round(video.videoWidth * scale);
              canvas.height = Math.round(video.videoHeight * scale);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
              code = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" })?.data ?? null;
            }
          } catch {
            code = null;
          }
          const now = Date.now();
          if (code && (code !== last.code || now - last.at > REPEAT_MS)) {
            last.code = code;
            last.at = now;
            onCodeRef.current(code);
          }
        }
        timer = window.setTimeout(tick, FRAME_MS);
      };
      tick();
    };

    start();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
      setState("idle");
    };
  }, [active, videoRef]);

  return state;
}
