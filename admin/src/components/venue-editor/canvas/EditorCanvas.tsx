"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Shape, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { ElementKind, Point, VenueMapContent } from "@/lib/venue-map-types";
import { MaterialIcon } from "@/components/icons";
import { bounds, distance, flatWorld, nearestEdge, rectFromCorners, rectsIntersect, snapVec, toNorm, toWorld, type Vec } from "../geometry";
import { insertVertex, moveVertex, removeVertex, transformSection, translateItems, updateElement, type SelectionItem } from "../contentOps";
import { elementKindOf, type Layers, type Tool } from "../editorTypes";
import { ElementShape, SectionShape } from "./Shapes";
import styles from "../VenueEditor.module.css";

export type EditorCanvasProps = {
  content: VenueMapContent;
  imageUrl: string | null;
  selection: SelectionItem[];
  tool: Tool;
  readOnly: boolean;
  layers: Layers;
  gridStep: number;
  snap: boolean;
  onSelect: (selection: SelectionItem[]) => void;
  onCommit: (content: VenueMapContent) => void;
  onSectionDrawn: (polygon: Point[]) => void;
  onElementPlaced: (kind: ElementKind, at: Point) => void;
  onCalibrationPoints: (a: Point, b: Point) => void;
  onCancelTool: () => void;
};

type View = { scale: number; x: number; y: number };

const MIN_SCALE = 0.02;
const MAX_SCALE = 12;
const CLOSE_RADIUS_PX = 10;

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

export default function EditorCanvas(props: EditorCanvasProps) {
  const { content, imageUrl, selection, tool, readOnly, layers, gridStep, snap, onSelect, onCommit } = props;
  const size = useMemo(() => ({ width: content.imageWidth, height: content.imageHeight }), [content.imageWidth, content.imageHeight]);
  const image = useHtmlImage(imageUrl);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  // Unknown until the container is measured; the stage waits for it so the first fit is exact.
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const [view, setView] = useState<View>({ scale: 0.5, x: 40, y: 40 });
  const [spacePan, setSpacePan] = useState(false);
  const [draft, setDraft] = useState<Vec[]>([]);
  const [hover, setHover] = useState<Vec | null>(null);
  const [marquee, setMarquee] = useState<{ from: Vec; to: Vec } | null>(null);
  const dragStart = useRef<Map<string, Vec>>(new Map());

  const panning = tool === "pan" || spacePan;
  const elementKind = elementKindOf(tool);
  const editable = !readOnly && tool === "select" && !panning;
  const step = snap ? gridStep : null;

  // --- Size and initial fit
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setBox({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fit = useCallback(() => {
    if (!box) return;
    const scale = Math.min(box.width / size.width, box.height / size.height) * 0.92;
    setView({ scale, x: (box.width - size.width * scale) / 2, y: (box.height - size.height * scale) / 2 });
  }, [box, size.width, size.height]);

  // Fit once when the container is first measured and whenever the plan size changes.
  const fitKey = box ? `${size.width}x${size.height}` : "";
  const lastFit = useRef("");
  useEffect(() => {
    if (!fitKey || lastFit.current === fitKey) return;
    lastFit.current = fitKey;
    const id = window.setTimeout(fit, 0);
    return () => window.clearTimeout(id);
  }, [fitKey, fit]);

  const zoomAt = useCallback((factor: number, center: Vec) => {
    setView((v) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      const world = { x: (center.x - v.x) / v.scale, y: (center.y - v.y) / v.scale };
      return { scale, x: center.x - world.x * scale, y: center.y - world.y * scale };
    });
  }, []);

  // --- Keyboard: space to pan, Enter/Escape/Backspace while drawing
  useEffect(() => {
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpacePan(true);
      }
      if (tool === "section" && draft.length > 0) {
        if (e.key === "Escape") setDraft([]);
        if (e.key === "Backspace") setDraft((d) => d.slice(0, -1));
        if (e.key === "Enter" && draft.length >= 3) {
          props.onSectionDrawn(draft.map((p) => toNorm(p, size)));
          setDraft([]);
        }
      } else if (e.key === "Escape" && (tool !== "select" || draft.length)) {
        setDraft([]);
        props.onCancelTool();
      }
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
  }, [tool, draft, size, props]);

  // Leaving a drawing tool drops any half-drawn shape.
  const [draftTool, setDraftTool] = useState(tool);
  if (draftTool !== tool) {
    setDraftTool(tool);
    setDraft([]);
    setMarquee(null);
  }

  // --- Transformer follows the selection
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = editable
      ? selection
          .filter((s) => s.kind === "section" || content.elements.find((e) => e.id === s.id)?.geometry.shape !== "point")
          .map((s) => stage.findOne(`#${s.id}`))
          .filter((n): n is Konva.Node => Boolean(n))
      : [];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selection, editable, content]);

  // --- Pointer helpers
  const worldPointer = (): Vec | null => {
    const stage = stageRef.current;
    const p = stage?.getPointerPosition();
    return p ? { x: (p.x - view.x) / view.scale, y: (p.y - view.y) / view.scale } : null;
  };

  const itemFromTarget = (target: Konva.Node): SelectionItem | null => {
    const group = target.findAncestor(".item", true) as Konva.Node | undefined;
    if (!group) return null;
    return { kind: group.hasName("section") ? "section" : "element", id: group.id() };
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    // Pinch / Ctrl+wheel zooms; plain wheel or two-finger scroll pans (like Figma).
    if (e.evt.ctrlKey || e.evt.metaKey) {
      zoomAt(Math.exp(-e.evt.deltaY * 0.01), pointer);
    } else {
      setView((v) => ({ ...v, x: v.x - e.evt.deltaX, y: v.y - e.evt.deltaY }));
    }
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (panning || e.evt.button !== 0) return;
    const p = worldPointer();
    if (!p) return;
    if (tool === "select" && !itemFromTarget(e.target) && e.target.getParent()?.className !== "Transformer") {
      setMarquee({ from: p, to: p });
    }
  };

  const handleMouseMove = () => {
    const p = worldPointer();
    if (!p) return;
    if (tool === "section" || tool === "calibrate") setHover(snapVec(p, step));
    if (marquee) setMarquee((m) => (m ? { ...m, to: p } : m));
  };

  const handleMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    if (!marquee) return;
    const rect = rectFromCorners(marquee.from, marquee.to);
    setMarquee(null);
    if (rect.width * view.scale < 4 && rect.height * view.scale < 4) {
      if (!e.evt.shiftKey) onSelect([]);
      return;
    }
    const hits: SelectionItem[] = [];
    for (const s of content.sections) {
      const b = bounds(s.polygon);
      const r = { x: b.minX * size.width, y: b.minY * size.height, width: (b.maxX - b.minX) * size.width, height: (b.maxY - b.minY) * size.height };
      if (rectsIntersect(rect, r)) hits.push({ kind: "section", id: s.id });
    }
    for (const el of content.elements) {
      const g = el.geometry;
      const r =
        g.shape === "rect" || g.shape === "ellipse"
          ? { x: g.x * size.width, y: g.y * size.height, width: g.w * size.width, height: g.h * size.height }
          : g.shape === "point"
            ? { x: g.x * size.width, y: g.y * size.height, width: 1, height: 1 }
            : null;
      if (r && rectsIntersect(rect, r)) hits.push({ kind: "element", id: el.id });
    }
    onSelect(e.evt.shiftKey ? [...selection, ...hits.filter((h) => !selection.some((s) => s.id === h.id))] : hits);
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (panning || e.evt.button !== 0) return;
    const raw = worldPointer();
    if (!raw) return;
    const p = snapVec(raw, step);

    if (tool === "section") {
      if (draft.length >= 3 && distance(p, draft[0]) * view.scale <= CLOSE_RADIUS_PX) {
        props.onSectionDrawn(draft.map((d) => toNorm(d, size)));
        setDraft([]);
        return;
      }
      setDraft((d) => [...d, p]);
      return;
    }
    if (tool === "calibrate") {
      if (draft.length === 0) setDraft([p]);
      else {
        // Not clamped to the image: a measurement must use the exact points clicked.
        const exact = (v: Vec): Point => [v.x / size.width, v.y / size.height];
        props.onCalibrationPoints(exact(draft[0]), exact(p));
        setDraft([]);
      }
      return;
    }
    if (elementKind) {
      props.onElementPlaced(elementKind, toNorm(p, size));
      return;
    }
    if (tool === "select") {
      const item = itemFromTarget(e.target);
      if (!item) return;
      if (e.evt.shiftKey) {
        onSelect(selection.some((s) => s.id === item.id) ? selection.filter((s) => s.id !== item.id) : [...selection, item]);
      } else if (!selection.some((s) => s.id === item.id) || selection.length > 1) {
        onSelect([item]);
      }
    }
  };

  const handleDblClick = () => {
    if (tool === "section" && draft.length >= 4) {
      // The two clicks of the double click already added the last point twice.
      props.onSectionDrawn(draft.slice(0, -1).map((d) => toNorm(d, size)));
      setDraft([]);
      return;
    }
    // Double click on the selected section's edge adds a vertex there.
    const only = selection.length === 1 && selection[0].kind === "section" ? content.sections.find((s) => s.id === selection[0].id) : null;
    const p = worldPointer();
    if (!only || !p || !editable) return;
    const edge = nearestEdge(only.polygon.map((pt) => toWorld(pt, size)), p);
    if (edge.dist * view.scale <= 12) onCommit(insertVertex(content, only.id, edge.index, toNorm(edge.point, size)));
  };

  // --- Dragging items (several selected items move together)
  const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
    const item = itemFromTarget(e.target);
    if (!item) return;
    const moving = selection.some((s) => s.id === item.id) ? selection : [item];
    if (!selection.some((s) => s.id === item.id)) onSelect([item]);
    const stage = stageRef.current!;
    dragStart.current = new Map(moving.map((s) => [s.id, stage.findOne(`#${s.id}`)?.position() ?? { x: 0, y: 0 }]));
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const start = dragStart.current.get(e.target.id());
    if (!start) return;
    const stage = stageRef.current!;
    const d = { x: e.target.x() - start.x, y: e.target.y() - start.y };
    for (const [id, pos] of dragStart.current) {
      if (id !== e.target.id()) stage.findOne(`#${id}`)?.position({ x: pos.x + d.x, y: pos.y + d.y });
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const start = dragStart.current.get(e.target.id());
    if (!start) return;
    let d = { x: e.target.x() - start.x, y: e.target.y() - start.y };
    if (step) {
      const snapped = snapVec({ x: start.x + d.x, y: start.y + d.y }, step);
      d = { x: snapped.x - start.x, y: snapped.y - start.y };
    }
    const items: SelectionItem[] = [...dragStart.current.keys()].map((id) => ({
      kind: content.sections.some((s) => s.id === id) ? "section" : "element",
      id,
    }));
    // Sections render at the origin; their geometry moves, so the group goes back to 0,0.
    const stage = stageRef.current!;
    for (const [id, pos] of dragStart.current) stage.findOne(`#${id}`)?.position(pos);
    dragStart.current = new Map();
    onCommit(translateItems(content, items, d.x / size.width, d.y / size.height));
  };

  // --- Rotate / scale with the transformer
  const handleTransformEnd = () => {
    const tr = trRef.current;
    if (!tr) return;
    let next = content;
    for (const node of tr.nodes()) {
      const id = node.id();
      if (node.hasName("section")) {
        next = transformSection(next, id, node.getTransform().getMatrix());
        node.setAttrs({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, skewX: 0, skewY: 0 });
      } else {
        const el = next.elements.find((x) => x.id === id);
        if (!el || (el.geometry.shape !== "rect" && el.geometry.shape !== "ellipse")) continue;
        const w = (el.geometry.w * size.width * Math.abs(node.scaleX())) / size.width;
        const h = (el.geometry.h * size.height * Math.abs(node.scaleY())) / size.height;
        const cx = node.x() / size.width;
        const cy = node.y() / size.height;
        next = updateElement(next, id, { rotation: Math.round(node.rotation() * 10) / 10, geometry: { ...el.geometry, x: cx - w / 2, y: cy - h / 2, w, h } });
        node.setAttrs({ scaleX: 1, scaleY: 1 });
      }
    }
    onCommit(next);
  };

  // --- Vertex handles of a single selected section
  const vertexSection = editable && selection.length === 1 && selection[0].kind === "section" ? content.sections.find((s) => s.id === selection[0].id) : null;

  const handleVertexMove = (sectionId: string, index: number, e: KonvaEventObject<DragEvent>) => {
    const line = stageRef.current?.findOne(`#poly-${sectionId}`) as Konva.Line | undefined;
    const section = content.sections.find((s) => s.id === sectionId);
    if (!line || !section) return;
    const pts = flatWorld(section.polygon, size);
    pts[index * 2] = e.target.x();
    pts[index * 2 + 1] = e.target.y();
    line.points(pts);
  };

  const handleVertexEnd = (sectionId: string, index: number, e: KonvaEventObject<DragEvent>) => {
    const p = snapVec({ x: e.target.x(), y: e.target.y() }, step);
    onCommit(moveVertex(content, sectionId, index, toNorm(p, size)));
  };

  const seatRadius = content.scaleMPerPx ? 0.24 / content.scaleMPerPx : Math.max(2.5, Math.min(size.width, size.height) / 320);
  const isSelected = (id: string) => selection.some((s) => s.id === id);
  const cursor = panning ? "grab" : tool === "select" ? "default" : "crosshair";
  const drawing = (tool === "section" || tool === "calibrate") && draft.length > 0;

  return (
    <div ref={wrapRef} className={styles.canvasWrap} style={{ cursor }}>
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
          if (e.target === stageRef.current) setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onDblClick={handleDblClick}
      >
        <Layer listening={false}>
          <Rect width={size.width} height={size.height} fill="#ffffff" shadowColor="#0f0e24" shadowOpacity={0.12} shadowBlur={24 / view.scale} />
          {layers.background.visible && image && <KonvaImage image={image} width={size.width} height={size.height} opacity={layers.backgroundOpacity} />}
          {!imageUrl && content.sections.length === 0 && content.elements.length === 0 && (
            <Text
              text="Sube la imagen del plano desde el panel derecho"
              width={size.width}
              y={size.height / 2 - 12 / view.scale}
              align="center"
              fontSize={16 / view.scale}
              fill="#94a3b8"
            />
          )}
          {layers.grid.visible && gridStep > 0 && gridStep * view.scale >= 6 && (
            <Shape
              perfectDrawEnabled={false}
              sceneFunc={(ctx, shape) => {
                ctx.beginPath();
                for (let x = 0; x <= size.width; x += gridStep) {
                  ctx.moveTo(x, 0);
                  ctx.lineTo(x, size.height);
                }
                for (let y = 0; y <= size.height; y += gridStep) {
                  ctx.moveTo(0, y);
                  ctx.lineTo(size.width, y);
                }
                ctx.strokeShape(shape);
              }}
              stroke="rgba(101, 52, 245, 0.16)"
              strokeWidth={1 / view.scale}
            />
          )}
        </Layer>

        <Layer onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
          {layers.sections.visible &&
            content.sections.map((s) => (
              <SectionShape
                key={s.id}
                section={s}
                size={size}
                scale={view.scale}
                selected={isSelected(s.id)}
                showSeats={layers.seats.visible}
                seatRadius={seatRadius}
                draggable={editable && !layers.sections.locked}
                listening={tool === "select" && !panning && !layers.sections.locked}
              />
            ))}
          {layers.elements.visible &&
            content.elements.map((el) => (
              <ElementShape
                key={el.id}
                element={el}
                size={size}
                scale={view.scale}
                selected={isSelected(el.id)}
                draggable={editable && !layers.elements.locked}
                listening={tool === "select" && !panning && !layers.elements.locked}
              />
            ))}
          <Transformer
            ref={trRef}
            // A single section is reshaped through its vertex handles; the box only rotates it.
            enabledAnchors={vertexSection ? [] : undefined}
            rotateEnabled
            keepRatio={false}
            ignoreStroke
            anchorSize={9}
            borderStroke="#ff782d"
            anchorStroke="#ff782d"
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            onTransformEnd={handleTransformEnd}
          />
        </Layer>

        <Layer>
          {vertexSection &&
            vertexSection.polygon.map((pt, i) => {
              const w = toWorld(pt, size);
              return (
                <Circle
                  key={i}
                  x={w.x}
                  y={w.y}
                  radius={6 / view.scale}
                  fill="#fff"
                  stroke="#ff782d"
                  strokeWidth={2 / view.scale}
                  draggable
                  onDragMove={(e) => handleVertexMove(vertexSection.id, i, e)}
                  onDragEnd={(e) => handleVertexEnd(vertexSection.id, i, e)}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    if (e.evt.altKey) onCommit(removeVertex(content, vertexSection.id, i));
                  }}
                  onMouseEnter={(e) => (e.target.getStage()!.container().style.cursor = "move")}
                  onMouseLeave={(e) => (e.target.getStage()!.container().style.cursor = "")}
                />
              );
            })}

          {drawing && (
            <Group listening={false}>
              <Line
                points={[...draft, ...(hover ? [hover] : [])].flatMap((p) => [p.x, p.y])}
                stroke={tool === "calibrate" ? "#2563eb" : "#ff782d"}
                strokeWidth={2 / view.scale}
                dash={[6 / view.scale, 4 / view.scale]}
              />
              {draft.map((p, i) => (
                <Circle key={i} x={p.x} y={p.y} radius={(i === 0 && tool === "section" ? 7 : 4) / view.scale} fill={i === 0 ? "#ff782d" : "#fff"} stroke="#ff782d" strokeWidth={2 / view.scale} />
              ))}
            </Group>
          )}

          {content.calibration && (tool === "calibrate" || layers.grid.visible) && (
            <Group listening={false}>
              <Line points={[...flatWorld([content.calibration.a, content.calibration.b], size)]} stroke="#2563eb" strokeWidth={2 / view.scale} />
              <Text
                x={toWorld(content.calibration.b, size).x + 6 / view.scale}
                y={toWorld(content.calibration.b, size).y}
                text={`${content.calibration.meters.toLocaleString("es-CL")} m`}
                fontSize={12 / view.scale}
                fontStyle="bold"
                fill="#2563eb"
              />
            </Group>
          )}

          {marquee && (
            <Rect
              {...rectFromCorners(marquee.from, marquee.to)}
              fill="rgba(255, 120, 45, 0.08)"
              stroke="#ff782d"
              strokeWidth={1 / view.scale}
              dash={[4 / view.scale, 3 / view.scale]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
      )}

      <div className={styles.zoomBar} role="group" aria-label="Zoom">
        <button type="button" onClick={() => box && zoomAt(1 / 1.25, { x: box.width / 2, y: box.height / 2 })} aria-label="Alejar">
          <MaterialIcon decorative name="remove" />
        </button>
        <span aria-live="polite">{Math.round(view.scale * 100)}%</span>
        <button type="button" onClick={() => box && zoomAt(1.25, { x: box.width / 2, y: box.height / 2 })} aria-label="Acercar">
          <MaterialIcon decorative name="add" />
        </button>
        <button type="button" onClick={fit} className={styles.fitButton}>
          Ajustar
        </button>
      </div>

      {hover && (tool === "section" || tool === "calibrate") && (
        <div className={styles.coords} aria-hidden="true">
          {content.scaleMPerPx
            ? `${(hover.x * content.scaleMPerPx).toFixed(1)} m · ${(hover.y * content.scaleMPerPx).toFixed(1)} m`
            : `${Math.round(hover.x)} · ${Math.round(hover.y)} px`}
        </div>
      )}
    </div>
  );
}
