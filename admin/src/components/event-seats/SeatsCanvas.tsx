"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Line, Rect, Shape, Stage, Text } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { EventSeat, EventSeatMap, EventSeatSector, PriceZone } from "@/lib/event-seats-data";
import { MaterialIcon } from "@/components/icons";
import { SEAT_COLORS } from "./seatStats";
import { cacheSeats, drawSeats, seatBounds } from "../venue-editor/canvas/seatDrawing";
import { useSettled } from "@/lib/useSettled";
import { centroid, flatWorld, rectFromCorners, toWorld, type Size, type Vec } from "../venue-editor/geometry";
import { ElementShape } from "../venue-editor/canvas/Shapes";
import { seatRadiusPx } from "../venue-editor/seatGenerator";
import editorStyles from "../venue-editor/VenueEditor.module.css";
import styles from "./EventSeats.module.css";

export type SelectMode = "replace" | "add" | "remove" | "toggle";

type View = { scale: number; x: number; y: number };

const MIN_SCALE = 0.02;
const MAX_SCALE = 16;


function useHtmlImage(url: string | null) {
  const [loaded, setLoaded] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  useEffect(() => {
    if (!url) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoaded({ url, img });
    img.src = url;
    return () => {
      img.onload = null;
    };
  }, [url]);
  return loaded && loaded.url === url ? loaded.img : null;
}

/**
 * Seats of one sector in a single canvas shape. Fill tells the price (zone
 * colour, or white = sector price); sold, held and blocked seats are drawn over it.
 */
const SectorSeats = memo(function SectorSeats({
  sector,
  zones,
  size,
  radius,
  cacheScale,
}: {
  sector: EventSeatSector;
  zones: Map<string, PriceZone>;
  size: Size;
  radius: number;
  cacheScale: number;
}) {
  const ref = useRef<Konva.Shape>(null);
  const bounds = useMemo(() => seatBounds(sector.seats.map((s) => ({ x: s.x * size.width, y: s.y * size.height })), radius), [sector.seats, size, radius]);
  // Kept as a bitmap at the settled zoom: panning and zooming only move it.
  useEffect(() => cacheSeats(ref.current, bounds, cacheScale), [bounds, zones, sector.color, cacheScale]);
  return (
    <Shape
      ref={ref}
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={(ctx) =>
        drawSeats(ctx._context, sector.seats, (seat) => ({ x: seat.x * size.width, y: seat.y * size.height }), radius, (seat) => {
          const zone = seat.zoneId ? zones.get(seat.zoneId) : undefined;
          if (seat.state === "BLOCKED") return { fill: SEAT_COLORS.blocked, stroke: zone?.color ?? sector.color, slash: SEAT_COLORS.blockedMark };
          return {
            fill: seat.state === "SOLD" ? SEAT_COLORS.sold : seat.state === "HELD" ? SEAT_COLORS.held : (zone?.color ?? "#ffffff"),
            stroke: seat.kind === "ACCESSIBLE" ? SEAT_COLORS.accessible : (zone?.color ?? sector.color),
            lineWidth: radius * (seat.kind === "ACCESSIBLE" ? 0.5 : 0.28),
            dash: seat.kind === "OBSTRUCTED" ? [radius * 0.5, radius * 0.4] : undefined,
          };
        })
      }
    />
  );
});

export default function SeatsCanvas({
  map,
  imageUrl,
  zones,
  selectedSeats,
  onSelect,
  describe,
}: {
  map: EventSeatMap;
  imageUrl: string | null;
  zones: Map<string, PriceZone>;
  selectedSeats: EventSeat[];
  onSelect: (ids: string[], mode: SelectMode) => void;
  describe: (seat: EventSeat) => string;
}) {
  const size = useMemo(() => ({ width: map.imageWidth, height: map.imageHeight }), [map.imageWidth, map.imageHeight]);
  const image = useHtmlImage(imageUrl);
  const radius = seatRadiusPx(size, map.scaleMPerPx);
  const allSeats = useMemo(() => map.sectors.flatMap((s) => s.seats), [map.sectors]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const [view, setView] = useState<View>({ scale: 0.5, x: 40, y: 40 });
  const [panMode, setPanMode] = useState(false);
  const [spacePan, setSpacePan] = useState(false);
  const [marquee, setMarquee] = useState<{ from: Vec; to: Vec; mode: SelectMode } | null>(null);
  const [hover, setHover] = useState<{ seat: EventSeat; at: Vec } | null>(null);
  const panning = panMode || spacePan;
  const settledScale = useSettled(view.scale);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setBox({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fit = useCallback(() => {
    if (!box) return;
    const scale = Math.min(box.width / size.width, box.height / size.height) * 0.94;
    setView({ scale, x: (box.width - size.width * scale) / 2, y: (box.height - size.height * scale) / 2 });
  }, [box, size.width, size.height]);

  // The plan follows the container size until the user zooms or pans it.
  const touched = useRef(false);
  useEffect(() => {
    if (!box || touched.current) return;
    const id = window.setTimeout(fit, 0);
    return () => window.clearTimeout(id);
  }, [box, fit]);

  const zoomAt = useCallback((factor: number, center: Vec) => {
    touched.current = true;
    setView((v) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      const world = { x: (center.x - v.x) / v.scale, y: (center.y - v.y) / v.scale };
      return { scale, x: center.x - world.x * scale, y: center.y - world.y * scale };
    });
  }, []);

  useEffect(() => {
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
    const down = (e: KeyboardEvent) => {
      if (typing(e) || e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      setSpacePan(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpacePan(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const worldPointer = (): Vec | null => {
    const p = stageRef.current?.getPointerPosition();
    return p ? { x: (p.x - view.x) / view.scale, y: (p.y - view.y) / view.scale } : null;
  };

  const nearestSeat = (p: Vec): EventSeat | null => {
    let best: EventSeat | null = null;
    // A little forgiving when zoomed out, so small seats are still easy to hit.
    let bestDist = Math.max(radius * 1.5, 6 / view.scale);
    for (const seat of allSeats) {
      const d = Math.hypot(seat.x * size.width - p.x, seat.y * size.height - p.y);
      if (d < bestDist) {
        best = seat;
        bestDist = d;
      }
    }
    return best;
  };

  const modeFor = (e: MouseEvent): SelectMode => (e.altKey ? "remove" : e.shiftKey || e.metaKey || e.ctrlKey ? "add" : "replace");

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    touched.current = true;
    if (e.evt.ctrlKey || e.evt.metaKey) zoomAt(Math.exp(-e.evt.deltaY * 0.01), pointer);
    else setView((v) => ({ ...v, x: v.x - e.evt.deltaX, y: v.y - e.evt.deltaY }));
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (panning || e.evt.button !== 0) return;
    const p = worldPointer();
    if (p) setMarquee({ from: p, to: p, mode: modeFor(e.evt) });
  };

  const handleMouseMove = () => {
    const p = worldPointer();
    if (!p) return;
    if (marquee) {
      setMarquee((m) => (m ? { ...m, to: p } : m));
      return;
    }
    if (panning) return;
    const seat = nearestSeat(p);
    setHover((h) => (seat ? (h?.seat === seat ? h : { seat, at: { x: seat.x * size.width * view.scale + view.x, y: seat.y * size.height * view.scale + view.y } }) : null));
  };

  const handleMouseUp = () => {
    if (!marquee) return;
    const rect = rectFromCorners(marquee.from, marquee.to);
    const { mode } = marquee;
    setMarquee(null);
    // A click (no drag) picks the nearest seat.
    if (rect.width * view.scale < 4 && rect.height * view.scale < 4) {
      const seat = nearestSeat(marquee.from);
      if (seat) onSelect([seat.id], mode === "add" ? "toggle" : mode);
      else if (mode === "replace") onSelect([], "replace");
      return;
    }
    const hits = allSeats
      .filter((s) => {
        const x = s.x * size.width;
        const y = s.y * size.height;
        return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
      })
      .map((s) => s.id);
    onSelect(hits, mode);
  };

  const cursor = panning ? "grab" : hover ? "pointer" : "crosshair";

  return (
    <div ref={wrapRef} className={editorStyles.canvasWrap} style={{ cursor }} onMouseLeave={() => setHover(null)}>
      {box && (
        <Stage
          ref={stageRef}
          width={box.width}
          height={box.height}
          scaleX={view.scale}
          scaleY={view.scale}
          x={view.x}
          y={view.y}
          draggable={panning}
          onDragEnd={(e) => {
            if (e.target !== stageRef.current) return;
            touched.current = true;
            setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer listening={false}>
            <Rect width={size.width} height={size.height} fill="#ffffff" shadowColor="#0f0e24" shadowOpacity={0.12} shadowBlur={24 / view.scale} />
            {image && <KonvaImage image={image} width={size.width} height={size.height} opacity={0.35} />}
            {map.elements.map((el) => (
              <ElementShape key={el.id} element={el} size={size} scale={view.scale} selected={false} draggable={false} listening={false} />
            ))}
            {map.sectors.map((s) => (
              <Line
                key={s.id}
                points={flatWorld(s.polygon, size)}
                closed
                fill={s.isActive ? `${s.color}1f` : "rgba(148, 163, 184, 0.12)"}
                stroke={s.isActive ? s.color : "#94a3b8"}
                strokeWidth={1.5 / view.scale}
                dash={s.isActive ? undefined : [8 / view.scale, 5 / view.scale]}
              />
            ))}
          </Layer>

          <Layer listening={false}>
            {map.sectors.map((s) => (s.seats.length > 0 ? <SectorSeats key={s.id} sector={s} zones={zones} size={size} radius={radius} cacheScale={settledScale} /> : null))}
            {/* Names would hide seats, so only sectors without seats are labelled. */}
            {map.sectors.map((s) => {
              if (s.seats.length > 0) return null;
              const at = toWorld(s.labelPoint ?? centroid(s.polygon), size);
              const fontSize = 13 / view.scale;
              return (
                <Text
                  key={s.id}
                  x={at.x}
                  y={at.y}
                  text={`${s.name}\n${s.isActive ? "Acceso general" : "No se vende"}`}
                  fontSize={fontSize}
                  fontStyle="bold"
                  fill="#1c1a2a"
                  stroke="#ffffff"
                  strokeWidth={3 / view.scale}
                  fillAfterStrokeEnabled
                  align="center"
                  width={180 / view.scale}
                  offsetX={90 / view.scale}
                  offsetY={fontSize}
                />
              );
            })}
          </Layer>

          <Layer listening={false}>
            {selectedSeats.length > 0 && (
              <Shape
                perfectDrawEnabled={false}
                sceneFunc={(ctx) => {
                  const c = ctx._context;
                  c.strokeStyle = SEAT_COLORS.selection;
                  c.lineWidth = Math.max(radius * 0.35, 2 / view.scale);
                  for (const seat of selectedSeats) {
                    c.beginPath();
                    c.arc(seat.x * size.width, seat.y * size.height, radius + c.lineWidth, 0, Math.PI * 2);
                    c.stroke();
                  }
                }}
              />
            )}
            {marquee && (
              <Rect
                {...rectFromCorners(marquee.from, marquee.to)}
                fill={marquee.mode === "remove" ? "rgba(100, 116, 139, 0.1)" : "rgba(255, 120, 45, 0.08)"}
                stroke={marquee.mode === "remove" ? "#64748b" : SEAT_COLORS.selection}
                strokeWidth={1 / view.scale}
                dash={[4 / view.scale, 3 / view.scale]}
              />
            )}
          </Layer>
        </Stage>
      )}

      {hover && !marquee && (
        <div className={styles.tooltip} style={{ left: hover.at.x, top: hover.at.y }} role="tooltip">
          {describe(hover.seat)}
        </div>
      )}

      <div className={editorStyles.zoomBar} role="group" aria-label="Zoom y desplazamiento">
        <button type="button" onClick={() => setPanMode((p) => !p)} aria-pressed={panMode} aria-label="Mover el plano (o mantén la barra espaciadora)" title="Mover el plano (barra espaciadora)" className={styles.panButton}>
          <MaterialIcon decorative name="pan_tool" />
        </button>
        <button type="button" onClick={() => box && zoomAt(1 / 1.25, { x: box.width / 2, y: box.height / 2 })} aria-label="Alejar">
          <MaterialIcon decorative name="remove" />
        </button>
        <span aria-live="polite">{Math.round(view.scale * 100)}%</span>
        <button type="button" onClick={() => box && zoomAt(1.25, { x: box.width / 2, y: box.height / 2 })} aria-label="Acercar">
          <MaterialIcon decorative name="add" />
        </button>
        <button type="button" onClick={fit} className={editorStyles.fitButton}>
          Ajustar
        </button>
      </div>
    </div>
  );
}
