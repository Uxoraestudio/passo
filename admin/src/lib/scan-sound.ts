import type { ScanResult } from "@/lib/validation-data";

/**
 * Door sounds: one shared AudioContext, unlocked on a tap (iOS only plays
 * audio started from a user gesture), and a distinct pattern per result so
 * the operator knows the outcome without looking at the screen.
 */

const MUTE_KEY = "passo.validacion.sonido";
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (ctx) return ctx;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  ctx = new Ctx();
  return ctx;
}

/** Call from a tap (Activar cámara, Validar): lets later sounds play on iPhone. */
export function unlockScanSound() {
  try {
    // Safari 17+: play even with the iPhone's silent switch on.
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "playback";
    const c = context();
    if (!c) return;
    if (c.state === "suspended") void c.resume();
    // A silent blip actually unlocks output on older iOS.
    const g = c.createGain();
    g.gain.value = 0;
    const o = c.createOscillator();
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.01);
  } catch {
    // No audio: the screen still shows the result.
  }
}

export function scanSoundOn(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setScanSoundOn(on: boolean) {
  try {
    window.localStorage.setItem(MUTE_KEY, on ? "on" : "off");
  } catch {
    // Private mode: the choice just isn't remembered.
  }
}

type Note = { f: number; at: number; dur: number; type?: OscillatorType; vol?: number };

// valid: two bright rising notes · already used: three quick mid buzzes ·
// rejected / error: one long low tone.
const PATTERNS: Record<"valid" | "used" | "bad", Note[]> = {
  valid: [
    { f: 988, at: 0, dur: 0.09 },
    { f: 1480, at: 0.1, dur: 0.16 },
  ],
  used: [
    { f: 520, at: 0, dur: 0.1, type: "square", vol: 0.05 },
    { f: 520, at: 0.16, dur: 0.1, type: "square", vol: 0.05 },
    { f: 520, at: 0.32, dur: 0.1, type: "square", vol: 0.05 },
  ],
  bad: [{ f: 180, at: 0, dur: 0.55, type: "sawtooth", vol: 0.07 }],
};

export function soundFor(result: ScanResult | "error"): keyof typeof PATTERNS {
  return result === "valid" ? "valid" : result === "already_used" ? "used" : "bad";
}

export function playScanSound(result: ScanResult | "error") {
  const kind = soundFor(result);
  try {
    navigator.vibrate?.(kind === "valid" ? 80 : kind === "used" ? [80, 60, 80, 60, 80] : 400);
  } catch {
    // Vibration isn't available on iPhone.
  }
  if (!scanSoundOn()) return;
  try {
    const c = context();
    if (!c) return;
    if (c.state === "suspended") void c.resume();
    const t0 = c.currentTime + 0.01;
    for (const n of PATTERNS[kind]) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = n.type ?? "sine";
      o.frequency.value = n.f;
      const vol = n.vol ?? 0.12;
      // Short attack and release so the notes don't click.
      g.gain.setValueAtTime(0, t0 + n.at);
      g.gain.linearRampToValueAtTime(vol, t0 + n.at + 0.01);
      g.gain.setValueAtTime(vol, t0 + n.at + n.dur - 0.02);
      g.gain.linearRampToValueAtTime(0, t0 + n.at + n.dur);
      o.connect(g).connect(c.destination);
      o.start(t0 + n.at);
      o.stop(t0 + n.at + n.dur + 0.02);
    }
  } catch {
    // No sound available: the screen still shows the result.
  }
}
