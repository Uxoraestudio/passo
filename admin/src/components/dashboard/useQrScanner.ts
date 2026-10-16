"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// Reads QR codes from the device camera. Uses the browser's BarcodeDetector
// where it exists (Chrome, Android) and jsQR otherwise (Safari, iPhone).
//
// Phones like the iPhone 14 Pro can't focus closer than ~20 cm with the main
// camera, so a QR held close is blurry. The scanner asks for continuous focus
// and, where the camera allows it, starts zoomed in (2×) so the code can be
// held farther away and still fill the frame. Frames are read at full
// resolution in the centre, alternating with the whole picture.

type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };

export type ScannerState = "idle" | "starting" | "scanning" | "denied" | "unavailable";
export type ZoomRange = { min: number; max: number; step: number };

/** The same code read again within this time is ignored (the QR stays in front of the camera). */
const REPEAT_MS = 4000;
const FRAME_MS = 150;
/** Largest side of the picture handed to jsQR. */
const DECODE_PX = 900;

type TrackCapabilities = MediaTrackCapabilities & { zoom?: { min: number; max: number; step?: number }; focusMode?: string[] };

export function useQrScanner(videoRef: RefObject<HTMLVideoElement | null>, active: boolean, paused: boolean, onCode: (code: string) => void) {
  const [state, setState] = useState<ScannerState>("idle");
  const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);
  const [zoom, setZoomState] = useState(1);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const onCodeRef = useRef(onCode);
  const pausedRef = useRef(paused);
  useEffect(() => {
    onCodeRef.current = onCode;
    pausedRef.current = paused;
  });

  const setZoom = useCallback((value: number) => {
    setZoomState(value);
    trackRef.current?.applyConstraints({ advanced: [{ zoom: value } as MediaTrackConstraintSet] }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer = 0;
    let frame = 0;
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
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      } catch (e) {
        if (!stopped) setState(e instanceof DOMException && e.name === "NotAllowedError" ? "denied" : "unavailable");
        return;
      }
      const video = videoRef.current;
      if (stopped || !video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // Focus and zoom, where the camera supports them.
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;
      const caps = (track?.getCapabilities?.() ?? {}) as TrackCapabilities;
      if (caps.focusMode?.includes("continuous")) {
        await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => {});
      }
      if (caps.zoom && caps.zoom.max > caps.zoom.min) {
        const range = { min: caps.zoom.min, max: Math.min(caps.zoom.max, 5), step: caps.zoom.step || 0.1 };
        const initial = Math.min(2, range.max);
        await track.applyConstraints({ advanced: [{ zoom: initial } as MediaTrackConstraintSet] }).catch(() => {});
        if (!stopped) {
          setZoomRange(range);
          setZoomState(initial);
        }
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
      if (!stopped) setState("scanning");

      const decode = (): string | null => {
        if (!jsQR || !ctx) return null;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        // Even frames: the centre square at full detail (where the operator aims).
        // Odd frames: the whole picture, for a code that isn't centred.
        const centre = frame % 2 === 0;
        const side = Math.min(vw, vh) * (centre ? 0.7 : 1);
        const sw = centre ? side : vw;
        const sh = centre ? side : vh;
        const sx = (vw - sw) / 2;
        const sy = (vh - sh) / 2;
        const scale = Math.min(1, DECODE_PX / Math.max(sw, sh));
        canvas.width = Math.round(sw * scale);
        canvas.height = Math.round(sh * scale);
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
      };

      const tick = async () => {
        if (stopped) return;
        if (!pausedRef.current && video.readyState >= 2 && video.videoWidth > 0) {
          frame++;
          let code: string | null = null;
          try {
            code = detector ? ((await detector.detect(video))[0]?.rawValue ?? null) : decode();
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
      trackRef.current = null;
      setZoomRange(null);
      setState("idle");
    };
  }, [active, videoRef]);

  return { state, zoom, zoomRange, setZoom };
}
