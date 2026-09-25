"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
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
    image: "/images/hero-concierto.jpg",
    alt: "Multitud viviendo un concierto en vivo",
    eyebrow: "Evento destacado",
    title: "Dua Lipa",
    subtitle: "Radical Optimism Tour",
    date: "24 OCT",
    venue: "Movistar Arena, Santiago",
    price: "Desde $ 48.000",
  },
  {
    id: "imagine-dragons",
    image: "/images/hero-festival-luces.jpg",
    alt: "Multitud con las manos arriba en un festival con luces moradas",
    eyebrow: "Próximamente",
    title: "Imagine Dragons",
    subtitle: "LOOM World Tour",
    date: "14 NOV",
    venue: "Estadio Nacional, Santiago",
    price: "Desde $ 52.000",
  },
];

const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD = 48;

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);

  const effectivePlaying = playing && !hovering;
  const active = slides[current];
  const activeHref = active.slug ? `/eventos/${active.slug}` : "/eventos";

  const goTo = (index: number) => setCurrent((index + slides.length) % slides.length);
  const goPrev = () => goTo(current - 1);
  const goNext = () => goTo(current + 1);
  const handleTimerEnd = () => setCurrent((prev) => (prev + 1) % slides.length);

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
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
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

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowPrev}`}
        onClick={goPrev}
        aria-label="Diapositiva anterior"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowNext}`}
        onClick={goNext}
        aria-label="Siguiente diapositiva"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

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

      <div className={styles.progressRow}>
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
                    key={current}
                    className={styles.segmentFill}
                    data-playing={effectivePlaying}
                    style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                    onAnimationEnd={handleTimerEnd}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.playButton}
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? "Pausar transición" : "Reanudar transición"}
        >
          {playing ? (
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <rect x="3" y="2.5" width="3.2" height="11" rx="1" />
              <rect x="9.8" y="2.5" width="3.2" height="11" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4 2.6a1 1 0 0 1 1.53-.85l8 5.4a1 1 0 0 1 0 1.7l-8 5.4A1 1 0 0 1 4 13.4V2.6Z" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}
