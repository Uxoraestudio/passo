"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Seat, Section, VenueMapContent } from "@/lib/venue-map-types";
import type { EventSeatMap } from "@/lib/event-seats-data";
import { defaultLayers } from "./editorTypes";
import styles from "./VenueEditor.module.css";

const EditorCanvas = dynamic(() => import("./canvas/EditorCanvas"), { ssr: false });
const SeatsCanvas = dynamic(() => import("../event-seats/SeatsCanvas"), { ssr: false });

const W = 2000;
const H = 1600;
const COLORS = ["#6534f5", "#ff782d", "#0ea5e9", "#16a34a"];

/** Four seated sections of 50 rows × 100 seats: 20,000 seats in all. */
function syntheticContent(): VenueMapContent {
  const sections: Section[] = [0, 1, 2, 3].map((q) => {
    const ox = (q % 2) * 0.5 + 0.03;
    const oy = Math.floor(q / 2) * 0.5 + 0.03;
    const seats: Seat[] = [];
    for (let r = 0; r < 50; r++) {
      for (let n = 0; n < 100; n++) {
        seats.push({
          rowLabel: `R${r + 1}`,
          label: `S${q}-${r + 1}-${n + 1}`,
          number: n + 1,
          x: ox + (n / 100) * 0.44,
          y: oy + (r / 50) * 0.44,
          kind: n % 40 === 0 ? "ACCESSIBLE" : "NORMAL",
          baseStatus: (r * 100 + n) % 53 === 0 ? "BLOCKED" : "AVAILABLE",
          manual: false,
        });
      }
    }
    return {
      id: `sec-${q}`,
      name: `Sector ${q + 1}`,
      shortLabel: null,
      kind: "SEATED",
      polygon: [
        [ox - 0.01, oy - 0.01],
        [ox + 0.45, oy - 0.01],
        [ox + 0.45, oy + 0.45],
        [ox - 0.01, oy + 0.45],
      ],
      capacity: null,
      color: COLORS[q],
      labelPoint: null,
      seatPrefix: "",
      generator: null,
      rows: Array.from({ length: 50 }, (_, r) => ({ label: `R${r + 1}` })),
      seats,
    };
  });
  return { imagePath: null, imageWidth: W, imageHeight: H, scaleMPerPx: null, calibration: null, notes: null, sections, elements: [] };
}

function eventMapOf(content: VenueMapContent): EventSeatMap {
  return {
    eventId: "bench",
    title: "Banco de pruebas",
    venueId: "bench",
    version: 1,
    imagePath: null,
    imageWidth: W,
    imageHeight: H,
    scaleMPerPx: null,
    elements: [],
    zones: [{ id: "z1", name: "VIP", color: "#e11d48", price: 50000 }],
    sectors: content.sections.map((s, q) => ({
      id: s.id,
      name: s.name,
      numbered: true,
      isActive: true,
      capacity: s.seats.length,
      price: 20000,
      color: s.color,
      polygon: s.polygon,
      labelPoint: null,
      seats: s.seats.map((seat, i) => ({
        id: `${s.id}-${i}`,
        sectorId: s.id,
        rowLabel: seat.rowLabel,
        label: seat.label,
        number: seat.number,
        x: seat.x,
        y: seat.y,
        kind: seat.kind,
        state: seat.baseStatus === "BLOCKED" ? "BLOCKED" : i % 31 === 0 ? "SOLD" : "AVAILABLE",
        zoneId: q === 0 && i < 1000 ? "z1" : null,
        blockReason: null,
      })),
    })),
  };
}

const noop = () => {};

export default function PerfHarness() {
  const content = useMemo(() => syntheticContent(), []);
  const eventMap = useMemo(() => eventMapOf(content), [content]);
  const zones = useMemo(() => new Map(eventMap.zones.map((z) => [z.id, z])), [eventMap]);
  const [view, setView] = useState<"plano" | "evento">("plano");
  return (
    <div className={styles.editor} style={{ height: "100dvh" }}>
      <div className={styles.topBar}>
        <b>Banco de rendimiento · 20.000 asientos</b>
        <button type="button" className={styles.secondaryButton} onClick={() => setView(view === "plano" ? "evento" : "plano")} data-bench-toggle>
          Ver {view === "plano" ? "asientos del evento" : "editor de plano"}
        </button>
      </div>
      <div className={styles.canvasArea} style={{ flex: 1 }} data-bench={view}>
        {view === "plano" ? (
          <EditorCanvas
            content={content}
            imageUrl={null}
            selection={[]}
            tool="select"
            readOnly
            layers={defaultLayers}
            gridStep={50}
            snap={false}
            onSelect={noop}
            onCommit={noop}
            onSectionDrawn={noop}
            onElementPlaced={noop}
            onCalibrationPoints={noop}
            onCancelTool={noop}
          />
        ) : (
          <SeatsCanvas map={eventMap} imageUrl={null} zones={zones} selectedSeats={[]} onSelect={noop} describe={(s) => s.label} />
        )}
      </div>
    </div>
  );
}
