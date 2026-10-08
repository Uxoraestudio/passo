"use client";

import { memo } from "react";
import { Circle, Ellipse, Group, Line, Rect, Shape, Text } from "react-konva";
import type { MapElement, Section, Seat } from "@/lib/venue-map-types";
import { centroid, flatWorld, toWorld, type Size } from "../geometry";
import { ELEMENT_COLORS } from "../contentOps";


const MARKER_LETTER: Partial<Record<MapElement["kind"], string>> = { ENTRANCE: "E", EXIT: "S", BATHROOM: "B" };

const SEAT_FILL: Record<Seat["kind"], string | null> = { NORMAL: null, ACCESSIBLE: "#2563eb", OBSTRUCTED: "#94a3b8" };

/** All seats of a section drawn by one canvas shape: fast even with thousands of seats. */
const SeatsShape = memo(function SeatsShape({ seats, color, size, radius }: { seats: Seat[]; color: string; size: Size; radius: number }) {
  return (
    <Shape
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={(ctx) => {
        const c = ctx._context;
        for (const seat of seats) {
          const x = seat.x * size.width;
          const y = seat.y * size.height;
          c.beginPath();
          c.arc(x, y, radius, 0, Math.PI * 2);
          c.fillStyle = seat.baseStatus === "BLOCKED" ? "#cbd5e1" : (SEAT_FILL[seat.kind] ?? color);
          c.fill();
          if (seat.baseStatus === "BLOCKED") {
            c.strokeStyle = "#475569";
            c.lineWidth = radius * 0.35;
            c.beginPath();
            c.moveTo(x - radius * 0.6, y - radius * 0.6);
            c.lineTo(x + radius * 0.6, y + radius * 0.6);
            c.stroke();
          }
        }
      }}
    />
  );
});

export function SectionShape({
  section,
  size,
  scale,
  selected,
  showSeats,
  seatRadius,
  draggable,
  listening,
}: {
  section: Section;
  size: Size;
  scale: number;
  selected: boolean;
  showSeats: boolean;
  seatRadius: number;
  draggable: boolean;
  listening: boolean;
}) {
  const label = section.labelPoint ?? centroid(section.polygon);
  const at = toWorld(label, size);
  const count = section.kind === "GENERAL_ADMISSION" ? (section.capacity ?? 0) : section.seats.length;
  const fontSize = 13 / scale;
  return (
    <Group id={section.id} name="item section" draggable={draggable} listening={listening}>
      <Line
        id={`poly-${section.id}`}
        points={flatWorld(section.polygon, size)}
        closed
        // Translucent fill (hex alpha) so the plan underneath stays readable.
        fill={`${section.color}${selected ? "55" : "33"}`}
        stroke={section.color}
        strokeWidth={(selected ? 3 : 1.5) / scale}
        dash={section.kind === "GENERAL_ADMISSION" ? [8 / scale, 5 / scale] : undefined}
      />
      {showSeats && section.seats.length > 0 && <SeatsShape seats={section.seats} color={section.color} size={size} radius={seatRadius} />}
      <Text
        x={at.x}
        y={at.y}
        text={`${section.name}\n${count.toLocaleString("es-CL")} ${section.kind === "GENERAL_ADMISSION" ? "pers." : "asientos"}`}
        fontSize={fontSize}
        fontStyle="bold"
        fill="#1c1a2a"
        // White halo keeps the name readable over seats and the plan image.
        stroke="#ffffff"
        strokeWidth={3 / scale}
        fillAfterStrokeEnabled
        align="center"
        width={160 / scale}
        offsetX={80 / scale}
        offsetY={fontSize}
        listening={false}
      />
    </Group>
  );
}

export function ElementShape({
  element,
  size,
  scale,
  selected,
  draggable,
  listening,
}: {
  element: MapElement;
  size: Size;
  scale: number;
  selected: boolean;
  draggable: boolean;
  listening: boolean;
}) {
  const g = element.geometry;
  const color = element.color ?? ELEMENT_COLORS[element.kind];
  const label = element.label ?? "";

  if (g.shape === "rect" || g.shape === "ellipse") {
    const w = g.w * size.width;
    const h = g.h * size.height;
    // Rotation is around the centre: the group sits at the centre of the box.
    return (
      <Group
        id={element.id}
        name="item element"
        x={(g.x + g.w / 2) * size.width}
        y={(g.y + g.h / 2) * size.height}
        rotation={element.rotation}
        draggable={draggable}
        listening={listening}
      >
        {g.shape === "rect" ? (
          <Rect x={-w / 2} y={-h / 2} width={w} height={h} fill={color} opacity={0.88} cornerRadius={6 / scale} stroke={selected ? "#ff782d" : undefined} strokeWidth={2 / scale} />
        ) : (
          <Ellipse radiusX={w / 2} radiusY={h / 2} fill={color} opacity={0.88} stroke={selected ? "#ff782d" : undefined} strokeWidth={2 / scale} />
        )}
        <Text text={label.toUpperCase()} fontSize={12 / scale} fontStyle="bold" letterSpacing={1 / scale} fill="#fff" width={w} height={h} x={-w / 2} y={-h / 2} align="center" verticalAlign="middle" listening={false} />
      </Group>
    );
  }

  if (g.shape === "polygon") {
    return (
      <Group id={element.id} name="item element" draggable={draggable} listening={listening}>
        <Line points={flatWorld(g.points, size)} closed fill={`${color}cc`} stroke={selected ? "#ff782d" : color} strokeWidth={2 / scale} />
      </Group>
    );
  }

  const p = toWorld([g.x, g.y], size);
  if (element.kind === "TEXT") {
    return (
      <Group id={element.id} name="item element" x={p.x} y={p.y} rotation={element.rotation} draggable={draggable} listening={listening}>
        <Text text={label || "Texto"} fontSize={15 / scale} fontStyle="bold" fill={color} offsetY={7.5 / scale} padding={2 / scale} />
        {selected && <Rect width={(label.length || 5) * 9 / scale} height={18 / scale} offsetY={9 / scale} stroke="#ff782d" strokeWidth={1.5 / scale} dash={[4 / scale, 3 / scale]} listening={false} />}
      </Group>
    );
  }

  const r = 11 / scale;
  return (
    <Group id={element.id} name="item element" x={p.x} y={p.y} draggable={draggable} listening={listening}>
      <Circle radius={r} fill={color} stroke={selected ? "#ff782d" : "#fff"} strokeWidth={(selected ? 3 : 2) / scale} />
      <Text text={MARKER_LETTER[element.kind] ?? "•"} fontSize={11 / scale} fontStyle="bold" fill="#fff" width={r * 2} height={r * 2} offsetX={r} offsetY={r} align="center" verticalAlign="middle" listening={false} />
      {label && (
        <Text text={label} fontSize={11 / scale} fontStyle="bold" fill="#1c1a2a" y={r + 3 / scale} width={140 / scale} offsetX={70 / scale} align="center" listening={false} />
      )}
    </Group>
  );
}
