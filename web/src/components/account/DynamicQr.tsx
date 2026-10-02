"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./MyTickets.module.css";

const SIZE = 25;
const ROTATION_MS = 30_000;

function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function inFinder(x: number, y: number) {
  const corners = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ];
  return corners.some(([cx, cy]) => x >= cx - 1 && x <= cx + 7 && y >= cy - 1 && y <= cy + 7);
}

function buildPath(seed: string) {
  const random = seededRandom(seed);
  let d = "";
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!inFinder(x, y) && random() > 0.52) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
}

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0h7v7H0zM1 1v5h5V1z" fillRule="evenodd" />
      <rect x="2" y="2" width="3" height="3" rx="0.6" />
    </g>
  );
}

export default function DynamicQr({ seed, label }: { seed: string; label: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const windowIndex = Math.floor(now / ROTATION_MS);
  const secondsLeft = Math.ceil((ROTATION_MS - (now % ROTATION_MS)) / 1000);
  const path = useMemo(() => buildPath(`${seed}:${windowIndex}`), [seed, windowIndex]);

  return (
    <figure className={styles.qrFigure}>
      <div className={styles.qrTile}>
        <svg key={windowIndex} viewBox={`-1 -1 ${SIZE + 2} ${SIZE + 2}`} className={styles.qrSvg} role="img" aria-label={label}>
          <path d={path} />
          <Finder x={0} y={0} />
          <Finder x={SIZE - 7} y={0} />
          <Finder x={0} y={SIZE - 7} />
        </svg>
      </div>
      <figcaption className={styles.qrCaption}>
        <span className={styles.qrTimer} aria-live="off">
          Código dinámico · se renueva en {secondsLeft} s
        </span>
        <span className={styles.qrTrack} aria-hidden="true">
          <span className={styles.qrProgress} style={{ transform: `scaleX(${secondsLeft / (ROTATION_MS / 1000)})` }} />
        </span>
      </figcaption>
    </figure>
  );
}
