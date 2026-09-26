"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Hero.module.css";

type Slide = {
  id: string;
  slug?: string;
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  date: string;
  venue: string;
  price: string;
};

const slides: Slide[] = [
  {
    id: "dua-lipa",
    image: "/images/hero-dua-lipa.jpg",
    alt: "Multitud viviendo un concierto de pop en vivo con luces rosadas y moradas",
    eyebrow: "Evento destacado",
    title: "Dua Lipa",
    subtitle: "Radical Optimism Tour",
    date: "24 OCT",
    venue: "Movistar Arena, Santiago",
    price: "Desde $ 48.000",
  },
  {
    id: "imagine-dragons",
    image: "/images/hero-imagine-dragons.jpg",
    alt: "Banda de rock tocando en vivo entre humo y luces rojas, con el público haciendo el gesto de cuernos",
    eyebrow: "Próximamente",
    title: "Imagine Dragons",
    subtitle: "LOOM World Tour",
    date: "14 NOV",
    venue: "Estadio Nacional, Santiago",
    price: "Desde $ 52.000",
  },
  {
    id: "clasico-pacifico",
    image: "/images/hero-clasico-pacifico.jpg",
    alt: "Estadio de fútbol repleto y iluminado durante un partido nocturno",
    eyebrow: "Deporte en vivo",
    title: "Clásico del Pacífico",
    subtitle: "Chile vs Perú",
    date: "05 DIC",
    venue: "Estadio Nacional, Santiago",
    price: "Desde $ 28.000",
  },
];

const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD = 48;
const RING_RADIUS = 15;
const RING_GAP_DEG = 10;

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarPoint(cx, cy, r, startAngle);
  const end = polarPoint(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const effectivePlaying = playing;
  const active = slides[current];
  const activeHref = active.slug ? `/eventos/${active.slug}` : "/eventos";

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Single JS-driven timer for both the segment bars and the pause-button
  // ring, instead of a CSS animation — avoids it getting stuck when paused
  // mid-transition and re-resumed (CSS animation-play-state was unreliable
  // across pause/resume/navigate combinations).
  useEffect(() => {
    if (!effectivePlaying) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startRef.current = null;
      return;
    }

    startRef.current = performance.now() - progressRef.current * AUTOPLAY_MS;

    const tick = (now: number) => {
      if (startRef.current === null) return;
      const elapsed = now - startRef.current;
      const pct = Math.min(elapsed / AUTOPLAY_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        setCurrent((prev) => (prev + 1) % slides.length);
        setProgress(0);
        startRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [effectivePlaying, current]);

  const goTo = (index: number) => {
    setCurrent((index + slides.length) % slides.length);
    setProgress(0);
  };
  const goPrev = () => goTo(current - 1);
  const goNext = () => goTo(current + 1);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
    dragDeltaX.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = event.clientX - dragStartX.current;
  };

  const onPointerUp = () => {
    if (dragStartX.current === null) return;
    if (dragDeltaX.current > SWIPE_THRESHOLD) goPrev();
    else if (dragDeltaX.current < -SWIPE_THRESHOLD) goNext();
    dragStartX.current = null;
    dragDeltaX.current = 0;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") goPrev();
    if (event.key === "ArrowRight") goNext();
    if (event.key === " ") {
      event.preventDefault();
      setPlaying((v) => !v);
    }
  };

  return (
    <section
      className={styles.hero}
      role="region"
      aria-roledescription="carousel"
      aria-label="Eventos destacados"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div
        className={styles.slides}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={styles.slide}
            data-active={index === current}
            aria-hidden={index !== current}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className={styles.image}
              draggable={false}
            />
          </div>
        ))}
        <div className={styles.gradient} />
      </div>

      <div className={styles.content} key={current}>
        <Link href={activeHref} className={styles.infoLink} aria-label={`Ver detalle de ${active.title}`}>
          <span className={styles.eyebrow}>{active.eyebrow}</span>
          <h2 className={styles.title}>{active.title}</h2>
          <p className={styles.subtitle}>{active.subtitle}</p>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M5 1.5V3.5M11 1.5V3.5M2.5 6.16667H13.5M3.83333 3H12.1667C12.9583 3 13.5833 3.625 13.5833 4.41667V12.75C13.5833 13.5417 12.9583 14.1667 12.1667 14.1667H3.83333C3.04167 14.1667 2.41667 13.5417 2.41667 12.75V4.41667C2.41667 3.625 3.04167 3 3.83333 3Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {active.date}
            </span>
            <span className={styles.metaDot} aria-hidden="true" />
            <span className={styles.metaItem}>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M13.5 6.66667C13.5 10.6667 8 14.1667 8 14.1667C8 14.1667 2.5 10.6667 2.5 6.66667C2.5 3.72111 4.98858 1.5 8 1.5C11.0114 1.5 13.5 3.72111 13.5 6.66667Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 8.5C9.10457 8.5 10 7.60457 10 6.5C10 5.39543 9.10457 4.5 8 4.5C6.89543 4.5 6 5.39543 6 6.5C6 7.60457 6.89543 8.5 8 8.5Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              </svg>
              {active.venue}
            </span>
          </div>
        </Link>
        <div className={styles.ctaRow}>
          <Link href={activeHref} className={styles.cta}>
            <span>Comprar entradas</span>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3.33333 8H12.6667M12.6667 8L8 3.33333M12.6667 8L8 12.6667"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <span className={styles.price}>{active.price}</span>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.segments} role="tablist" aria-label="Diapositivas del banner">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === current}
              aria-label={`Ir a la diapositiva ${index + 1}: ${slide.title}`}
              className={styles.segment}
              onClick={() => goTo(index)}
            >
              <span className={styles.segmentTrack}>
                {index < current && <span className={styles.segmentFill} data-complete="true" />}
                {index === current && (
                  <span
                    className={styles.segmentFill}
                    data-playing={effectivePlaying}
                    style={{ transform: `scaleX(${progress})` }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.navButton} onClick={goPrev} aria-label="Diapositiva anterior">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            className={styles.playButton}
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Pausar transición" : "Reanudar transición"}
          >
            <svg className={styles.playButtonRing} viewBox="0 0 36 36" aria-hidden="true">
              {slides.map((slide, index) => {
                const segmentSweep = 360 / slides.length - RING_GAP_DEG;
                const segStart = index * (segmentSweep + RING_GAP_DEG);
                const segEnd = segStart + segmentSweep;
                const fillFraction = index < current ? 1 : index === current ? progress : 0;
                const fillEnd = segStart + segmentSweep * fillFraction;
                return (
                  <g key={slide.id}>
                    <path
                      className={styles.playButtonRingTrack}
                      d={describeArc(18, 18, RING_RADIUS, segStart, segEnd)}
                    />
                    {fillFraction > 0 && (
                      <path
                        className={styles.playButtonRingFill}
                        d={describeArc(18, 18, RING_RADIUS, segStart, fillEnd)}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
            {playing ? (
              <svg className={styles.playButtonIcon} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <rect x="3" y="2.5" width="3.2" height="11" rx="1" />
                <rect x="9.8" y="2.5" width="3.2" height="11" rx="1" />
              </svg>
            ) : (
              <svg className={styles.playButtonIcon} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4 2.6a1 1 0 0 1 1.53-.85l8 5.4a1 1 0 0 1 0 1.7l-8 5.4A1 1 0 0 1 4 13.4V2.6Z" />
              </svg>
            )}
          </button>

          <button type="button" className={styles.navButton} onClick={goNext} aria-label="Siguiente diapositiva">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
