"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MaterialIcon } from "@/components/icons";
import { useCanEdit } from "@/lib/access";
import { getVenueById, type Venue } from "@/lib/venues-data";
import {
  createVenueMapDraft,
  deleteVenueMapDraft,
  getVenueMap,
  listVenueMaps,
  publishVenueMap,
  saveVenueMap,
  uploadVenueMapImage,
  venueMapImageUrl,
  VenueMapError,
} from "@/lib/venue-maps-data";
import { mapCapacity, type ElementKind, type Point, type VenueMap, type VenueMapContent, type VenueMapSummary } from "@/lib/venue-map-types";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import { addElement, addSection, applyGeneration, deleteItems, parseSeatRef, translateItems, updateSection, type SelectionItem } from "./contentOps";
import { defaultParams, generateSeats, mergeWithManual, seatRadiusPx, type GeneratorParams } from "./seatGenerator";
import SeatGeneratorPanel from "./SeatGeneratorPanel";
import { defaultLayers, type Layers, type Tool } from "./editorTypes";
import { scaleFromCalibration } from "./geometry";
import { useMapHistory } from "./useMapHistory";
import Toolbar, { TOOL_SHORTCUTS } from "./Toolbar";
import LayersPanel from "./LayersPanel";
import PropertiesPanel from "./PropertiesPanel";
import styles from "./VenueEditor.module.css";

const EditorCanvas = dynamic(() => import("./canvas/EditorCanvas"), {
  ssr: false,
  loading: () => <div className={styles.canvasLoading}>Cargando lienzo…</div>,
});

const emptyContent: VenueMapContent = {
  imagePath: null,
  imageWidth: 1600,
  imageHeight: 1000,
  scaleMPerPx: null,
  calibration: null,
  notes: null,
  sections: [],
  elements: [],
};

const contentOf = (m: VenueMap): VenueMapContent => ({
  imagePath: m.imagePath,
  imageWidth: m.imageWidth,
  imageHeight: m.imageHeight,
  scaleMPerPx: m.scaleMPerPx,
  calibration: m.calibration,
  notes: m.notes,
  sections: m.sections,
  elements: m.elements,
});

const isTyping = (e: KeyboardEvent) =>
  e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready" };

export default function VenueMapEditor({ venueId }: { venueId: string }) {
  const canEdit = useCanEdit("eventos");
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [venue, setVenue] = useState<Venue | null>(null);
  const [versions, setVersions] = useState<VenueMapSummary[]>([]);
  const [map, setMap] = useState<Pick<VenueMap, "id" | "version" | "status"> | null>(null);
  const history = useMapHistory(emptyContent);
  const { content, commit, reset, undo, redo } = history;
  const [saved, setSaved] = useState<VenueMapContent>(emptyContent);

  const [selection, setSelection] = useState<SelectionItem[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [layers, setLayers] = useState<Layers>(defaultLayers);
  const [generator, setGenerator] = useState<{ sectionId: string; params: GeneratorParams; prefix: string } | null>(null);
  const [gridStep, setGridStep] = useState(50);
  const [snap, setSnap] = useState(false);

  const [busy, setBusy] = useState<null | "save" | "publish" | "version" | "upload">(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [calibration, setCalibration] = useState<{ a: Point; b: Point; meters: string } | null>(null);
  const [confirm, setConfirm] = useState<null | { kind: "publish" } | { kind: "switch"; mapId: string } | { kind: "discard" }>(null);

  const readOnly = !canEdit || map?.status !== "draft";
  // Sections the database would refuse to publish: seated without seats, or GA without capacity.
  const blockers = content.sections.filter((s) => (s.kind === "SEATED" ? s.seats.length === 0 : !(Number(s.capacity) > 0)));
  const dirty = content !== saved;
  const imageUrl = useMemo(() => (content.imagePath ? venueMapImageUrl(content.imagePath) : null), [content.imagePath]);

  const flash = useCallback((tone: "ok" | "error", text: string) => {
    setNotice({ tone, text });
    if (tone === "ok") window.setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 3500);
  }, []);

  const openMap = useCallback(
    async (mapId: string) => {
      const full = await getVenueMap(mapId);
      setMap({ id: full.id, version: full.version, status: full.status });
      const c = contentOf(full);
      reset(c);
      setSaved(c);
      setSelection([]);
      setTool("select");
    },
    [reset]
  );

  const loadAll = useCallback(async () => {
    try {
      const [v, list] = await Promise.all([getVenueById(venueId), listVenueMaps(venueId)]);
      if (!v) {
        setLoad({ state: "error", message: "Este recinto no existe o fue eliminado." });
        return;
      }
      setVenue(v);
      setVersions(list);
      // Open the draft if there is one, otherwise the latest published version.
      const target = list.find((m) => m.status === "draft") ?? list[0];
      if (target) await openMap(target.id);
      setLoad({ state: "ready" });
    } catch (e) {
      setLoad({ state: "error", message: e instanceof VenueMapError ? e.message : "No pudimos cargar el recinto. Revisa tu conexión." });
    }
  }, [venueId, openMap]);

  useEffect(() => {
    const id = window.setTimeout(loadAll, 0);
    return () => window.clearTimeout(id);
  }, [loadAll]);

  const refreshVersions = async () => setVersions(await listVenueMaps(venueId));

  // --- Actions
  const save = useCallback(async () => {
    if (!map || readOnly || busy) return false;
    setBusy("save");
    try {
      const summary = await saveVenueMap(map.id, content);
      setSaved(content);
      flash("ok", `Plano guardado · ${summary.sections} ${summary.sections === 1 ? "sector" : "sectores"} · capacidad ${summary.capacity.toLocaleString("es-CL")}.`);
      return true;
    } catch (e) {
      flash("error", e instanceof VenueMapError ? e.message : "No pudimos guardar el plano. Tus cambios siguen en pantalla; inténtalo de nuevo.");
      return false;
    } finally {
      setBusy(null);
    }
  }, [map, readOnly, busy, content, flash]);

  const publish = async () => {
    if (!map) return;
    if (dirty && !(await save())) {
      setConfirm(null);
      return;
    }
    setBusy("publish");
    try {
      const result = await publishVenueMap(map.id);
      setMap({ ...map, status: "published" });
      await refreshVersions();
      flash("ok", `Versión ${result.version} publicada · capacidad ${result.capacity.toLocaleString("es-CL")}. Ya puedes usarla en tus eventos.`);
    } catch (e) {
      flash("error", e instanceof VenueMapError ? e.message : "No pudimos publicar el plano.");
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  const newVersion = async (fromMapId: string | null) => {
    setBusy("version");
    try {
      const draft = await createVenueMapDraft(venueId, fromMapId);
      await refreshVersions();
      await openMap(draft.id);
      flash("ok", fromMapId ? `Borrador v${draft.version} creado a partir de la versión publicada.` : "Plano creado. Sube la imagen y dibuja los sectores.");
    } catch (e) {
      flash("error", e instanceof VenueMapError ? e.message : "No pudimos crear la versión.");
    } finally {
      setBusy(null);
    }
  };

  const discardDraft = async () => {
    if (!map) return;
    setBusy("version");
    try {
      await deleteVenueMapDraft(map.id);
      const list = await listVenueMaps(venueId);
      setVersions(list);
      if (list[0]) await openMap(list[0].id);
      else {
        setMap(null);
        reset(emptyContent);
        setSaved(emptyContent);
      }
      flash("ok", "Borrador descartado.");
    } catch (e) {
      flash("error", e instanceof VenueMapError ? e.message : "No pudimos descartar el borrador.");
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  const uploadImage = async (file: File) => {
    setBusy("upload");
    try {
      const img = await uploadVenueMapImage(venueId, file);
      const ratioChanged = content.imagePath && Math.abs(img.width / img.height - content.imageWidth / content.imageHeight) > 0.02;
      commit({
        ...content,
        imagePath: img.path,
        imageWidth: img.width,
        imageHeight: img.height,
        // Calibration points are normalised and stay put; meters per pixel follow the new resolution.
        scaleMPerPx: content.scaleMPerPx ? (content.scaleMPerPx * content.imageWidth) / img.width : null,
      });
      flash(
        ratioChanged ? "error" : "ok",
        ratioChanged
          ? "La nueva imagen tiene otra proporción: revisa que los sectores sigan calzando con el plano."
          : `Imagen cargada (${img.width.toLocaleString("es-CL")} × ${img.height.toLocaleString("es-CL")} px). Recuerda guardar.`
      );
    } catch (e) {
      flash("error", e instanceof VenueMapError ? e.message : "No pudimos subir la imagen.");
    } finally {
      setBusy(null);
    }
  };

  const applyCalibration = () => {
    if (!calibration) return;
    const meters = Number(calibration.meters.replace(",", "."));
    const scale = scaleFromCalibration(calibration.a, calibration.b, meters, { width: content.imageWidth, height: content.imageHeight });
    if (!scale) return;
    commit({ ...content, calibration: { a: calibration.a, b: calibration.b, meters }, scaleMPerPx: scale });
    setGridStep(Math.max(2, Math.round(1 / scale)));
    setCalibration(null);
    setTool("select");
    flash("ok", `Escala calibrada: 1 m = ${Math.round(1 / scale)} px. La grilla ahora marca 1 metro.`);
  };

  // --- Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || confirm || calibration) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === "s") {
        e.preventDefault();
        save();
        return;
      }
      if (mod && key === "z") {
        e.preventDefault();
        if (!readOnly) (e.shiftKey ? redo : undo)();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        if (!readOnly) redo();
        return;
      }
      if (mod || e.altKey) return;
      const shortcut = TOOL_SHORTCUTS[key];
      if (shortcut && (shortcut === "select" || shortcut === "pan" || !readOnly)) {
        setTool(shortcut);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selection.length && !readOnly && tool === "select") {
        e.preventDefault();
        commit(deleteItems(content, selection));
        setSelection([]);
        return;
      }
      if (e.key === "Escape" && tool === "select") setSelection([]);
      const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (arrows[e.key] && selection.length && !readOnly) {
        e.preventDefault();
        const stepPx = e.shiftKey ? 10 : 1;
        const [dx, dy] = arrows[e.key];
        commit(translateItems(content, selection, (dx * stepPx) / content.imageWidth, (dy * stepPx) / content.imageHeight));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [content, selection, tool, readOnly, confirm, calibration, save, undo, redo, commit]);

  // --- Unsaved changes guard
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Drop selections that no longer exist (after undo, delete…).
  const liveSelection = selection.filter((s) => {
    if (s.kind === "section") return content.sections.some((x) => x.id === s.id);
    if (s.kind === "element") return content.elements.some((x) => x.id === s.id);
    const { sectionId, label } = parseSeatRef(s.id);
    return content.sections.find((x) => x.id === sectionId)?.seats.some((x) => x.label === label) ?? false;
  });

  // --- Seat generator (live preview until applied)
  const size = { width: content.imageWidth, height: content.imageHeight };
  const stageElement = content.elements.find((e) => e.kind === "STAGE");
  const stagePoint: Point | null = stageElement
    ? stageElement.geometry.shape === "polygon"
      ? stageElement.geometry.points[0]
      : stageElement.geometry.shape === "point"
        ? [stageElement.geometry.x, stageElement.geometry.y]
        : [stageElement.geometry.x + stageElement.geometry.w / 2, stageElement.geometry.y + stageElement.geometry.h / 2]
    : null;
  const genSection = generator ? content.sections.find((s) => s.id === generator.sectionId) : undefined;
  const seatRadius = seatRadiusPx({ width: content.imageWidth, height: content.imageHeight }, content.scaleMPerPx);
  const genResult = useMemo(
    () => (genSection && generator ? generateSeats(generator.params, genSection.polygon, { width: content.imageWidth, height: content.imageHeight }, generator.prefix) : null),
    [genSection, generator, content.imageWidth, content.imageHeight]
  );
  const genMerged = useMemo(
    () =>
      genSection && genResult
        ? mergeWithManual(genSection.seats, genSection.rows, genResult, seatRadius * 1.8, { width: content.imageWidth, height: content.imageHeight })
        : null,
    [genSection, genResult, seatRadius, content.imageWidth, content.imageHeight]
  );

  const openGenerator = (sectionId: string) => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const saved = section.generator as Partial<GeneratorParams> | null;
    const base = defaultParams(section.polygon, size, content.scaleMPerPx, stagePoint);
    setGenerator({ sectionId, params: saved && typeof saved.rows === "number" ? { ...base, ...saved } : base, prefix: section.seatPrefix });
    setTool("select");
  };

  const applyGenerator = () => {
    if (!generator || !genMerged) return;
    // Prefix and seats change together: one undo step, labels always match the sector prefix.
    commit(applyGeneration(updateSection(content, generator.sectionId, { seatPrefix: generator.prefix }), generator.sectionId, genMerged.rows, genMerged.seats, generator.params));
    setSelection([{ kind: "section", id: generator.sectionId }]);
    flash("ok", `${genMerged.seats.length.toLocaleString("es-CL")} asientos aplicados. Recuerda guardar.`);
    setGenerator(null);
  };

  if (load.state === "loading") return <div className={styles.stateCard}>Cargando recinto…</div>;
  if (load.state === "error")
    return (
      <div className={styles.stateCard} role="alert">
        <p>{load.message}</p>
        <Link href="/recintos/" className={styles.secondaryButton}>
          Volver a Recintos
        </Link>
      </div>
    );

  const statusLabel = !map ? "Sin plano" : map.status === "draft" ? `Borrador v${map.version}` : `Publicado v${map.version}`;
  const published = versions.find((v) => v.status === "published");

  return (
    <div className={styles.editor}>
      <header className={styles.topBar}>
        <Link href="/recintos/" className={styles.back} aria-label="Volver a Recintos">
          <MaterialIcon decorative name="arrow_back" />
        </Link>
        <div className={styles.titleBlock}>
          <h1>{venue?.name}</h1>
          <p>
            {venue?.city} · <span className={styles.status} data-status={map?.status ?? "none"}>{statusLabel}</span>
            {map && <> · capacidad {mapCapacity(content).toLocaleString("es-CL")}</>}
          </p>
        </div>

        {versions.length > 1 && (
          <label className={styles.versionSelect}>
            <span className="sr-only">Versión del plano</span>
            <select
              value={map?.id ?? ""}
              onChange={(e) => (dirty ? setConfirm({ kind: "switch", mapId: e.target.value }) : openMap(e.target.value))}
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version} · {v.status === "draft" ? "Borrador" : "Publicada"}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className={styles.topActions}>
          {!readOnly && (
            <>
              <button type="button" className={styles.iconButton} onClick={undo} disabled={!history.canUndo} aria-label="Deshacer (Cmd/Ctrl + Z)" title="Deshacer (Cmd/Ctrl + Z)">
                <MaterialIcon decorative name="undo" />
              </button>
              <button type="button" className={styles.iconButton} onClick={redo} disabled={!history.canRedo} aria-label="Rehacer (Cmd/Ctrl + Mayús + Z)" title="Rehacer (Cmd/Ctrl + Mayús + Z)">
                <MaterialIcon decorative name="redo" />
              </button>
              <span className={styles.saveState} aria-live="polite">
                {busy === "save" ? "Guardando…" : dirty ? "Cambios sin guardar" : "Todo guardado"}
              </span>
              {map?.status === "draft" && (
                <button type="button" className={styles.secondaryButton} onClick={() => setConfirm({ kind: "discard" })} disabled={!!busy}>
                  Descartar borrador
                </button>
              )}
              <button type="button" className={styles.secondaryButton} onClick={save} disabled={!dirty || !!busy}>
                Guardar
              </button>
              <button type="button" className={styles.primaryButton} onClick={() => setConfirm({ kind: "publish" })} disabled={!!busy || content.sections.length === 0}>
                Publicar
              </button>
            </>
          )}
          {canEdit && map?.status === "published" && !versions.some((v) => v.status === "draft") && (
            <button type="button" className={styles.primaryButton} onClick={() => newVersion(map.id)} disabled={!!busy}>
              <MaterialIcon decorative name="edit" />
              Editar en una nueva versión
            </button>
          )}
        </div>
      </header>

      {notice && (
        <div className={styles.notice} data-tone={notice.tone} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.text}
          <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
            <MaterialIcon decorative name="close" />
          </button>
        </div>
      )}

      {!map ? (
        <div className={styles.emptyState}>
          <MaterialIcon decorative name="map" />
          <h2>Este recinto aún no tiene plano</h2>
          <p>Sube la imagen del plano, calibra la escala y dibuja los sectores. Después podrás generar los asientos y usarlo en tus eventos.</p>
          {canEdit ? (
            <button type="button" className={styles.primaryButton} onClick={() => newVersion(null)} disabled={!!busy}>
              Crear plano
            </button>
          ) : (
            <p className={styles.muted}>Tu rol solo permite ver.</p>
          )}
        </div>
      ) : (
        <div className={styles.body}>
          <Toolbar tool={tool} readOnly={readOnly} onTool={setTool} />
          <div className={styles.canvasArea}>
            {map.status === "published" && (
              <div className={styles.readOnlyBadge}>
                <MaterialIcon decorative name="lock" />
                Versión publicada: solo lectura
              </div>
            )}
            <EditorCanvas
              preview={genMerged ? { seats: genMerged.seats, color: "#ff782d", sectionId: generator!.sectionId } : null}
              content={content}
              imageUrl={imageUrl}
              selection={liveSelection}
              tool={tool}
              readOnly={readOnly}
              layers={layers}
              gridStep={gridStep}
              snap={snap}
              onSelect={setSelection}
              onCommit={commit}
              onSectionDrawn={(polygon) => {
                const r = addSection(content, polygon);
                commit(r.content);
                setSelection([{ kind: "section", id: r.id }]);
                setTool("select");
              }}
              onElementPlaced={(kind: ElementKind, at: Point) => {
                const r = addElement(content, kind, at);
                commit(r.content);
                setSelection([{ kind: "element", id: r.id }]);
                setTool("select");
              }}
              onCalibrationPoints={(a, b) => setCalibration({ a, b, meters: content.calibration ? String(content.calibration.meters) : "" })}
              onCancelTool={() => setTool("select")}
            />
          </div>
          <aside className={styles.sidePanel} aria-label="Propiedades y capas">
            {generator && genSection && genResult && genMerged ? (
              <SeatGeneratorPanel
                section={genSection}
                params={generator.params}
                prefix={generator.prefix}
                result={genResult}
                dropped={genMerged.dropped}
                manualCount={genSection.seats.filter((s) => s.manual).length}
                size={size}
                scaleMPerPx={content.scaleMPerPx}
                stage={stagePoint}
                onChange={(params) => setGenerator({ ...generator, params })}
                onPrefix={(prefix) => setGenerator({ ...generator, prefix })}
                onApply={applyGenerator}
                onCancel={() => setGenerator(null)}
              />
            ) : (
              <PropertiesPanel
                content={content}
                selection={liveSelection}
                readOnly={readOnly}
                uploading={busy === "upload"}
                onCommit={commit}
                onSelect={setSelection}
                onUploadImage={uploadImage}
                onOpenGenerator={openGenerator}
              />
            )}
            <LayersPanel
              layers={layers}
              onChange={setLayers}
              gridStep={gridStep}
              onGridStep={setGridStep}
              snap={snap}
              onSnap={setSnap}
              gridLabel={content.scaleMPerPx ? `px ≈ ${(gridStep * content.scaleMPerPx).toLocaleString("es-CL", { maximumFractionDigits: 2 })} m` : "px"}
            />
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={calibration !== null}
        kind="form"
        icon="straighten"
        title="Calibrar escala"
        onClose={() => setCalibration(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setCalibration(null) },
          { label: "Aplicar escala", variant: "primary", onClick: applyCalibration },
        ]}
      >
        <p>¿Cuántos metros reales hay entre los dos puntos que marcaste? Usa una medida conocida del plano, como el ancho del escenario o de la cancha.</p>
        <label className={styles.field} style={{ marginTop: 12 }}>
          <span>Distancia real (metros)</span>
          <input
            data-autofocus
            type="number"
            min={0.1}
            step={0.1}
            inputMode="decimal"
            value={calibration?.meters ?? ""}
            onChange={(e) => calibration && setCalibration({ ...calibration, meters: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && applyCalibration()}
          />
        </label>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === "publish" && blockers.length > 0}
        icon="info"
        title="Todavía no se puede publicar"
        onClose={() => setConfirm(null)}
        details={blockers.map((s) => `${s.name}: ${s.kind === "SEATED" ? "no tiene asientos" : "no tiene capacidad"}`)}
        actions={[
          {
            label: "Ir al primer sector",
            variant: "soft",
            onClick: () => {
              setSelection([{ kind: "section", id: blockers[0].id }]);
              setConfirm(null);
            },
          },
          { label: "Entendido", variant: "primary", onClick: () => setConfirm(null), autoFocus: true },
        ]}
      >
        <p>
          Cada sector necesita capacidad. Los sectores «con asientos numerados» la obtienen de sus asientos, que se crearán con el generador de asientos (próxima etapa). Si quieres publicar ahora, cambia esos sectores a «Entrada general» e indica cuántas personas caben.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === "publish" && blockers.length === 0}
        icon="publish"
        title={`¿Publicar la versión ${map?.version ?? ""}?`}
        busy={busy === "publish" || busy === "save"}
        onClose={() => setConfirm(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setConfirm(null), autoFocus: true },
          { label: dirty ? "Guardar y publicar" : "Publicar", variant: "primary", onClick: publish, busyLabel: "Publicando…" },
        ]}
      >
        <p>
          Una versión publicada queda congelada y se puede usar en eventos. Para cambiarla después, crearás una versión nueva; los eventos que ya la usan no se verán afectados.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === "switch"}
        title="¿Cambiar de versión sin guardar?"
        onClose={() => setConfirm(null)}
        actions={[
          { label: "Seguir editando", variant: "soft", onClick: () => setConfirm(null), autoFocus: true },
          {
            label: "Descartar cambios",
            variant: "danger",
            onClick: () => {
              if (confirm?.kind === "switch") openMap(confirm.mapId);
              setConfirm(null);
            },
          },
        ]}
      >
        <p>Tienes cambios sin guardar en este borrador. Si cambias de versión se perderán.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === "discard"}
        icon="delete"
        title="¿Descartar el borrador?"
        busy={busy === "version"}
        onClose={() => setConfirm(null)}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: () => setConfirm(null), autoFocus: true },
          { label: "Descartar borrador", variant: "danger", onClick: discardDraft, busyLabel: "Descartando…" },
        ]}
      >
        <p>
          {published
            ? "Se eliminará este borrador y volverás a la última versión publicada. Esta acción no se puede deshacer."
            : "Se eliminará este borrador y el recinto quedará sin plano. Esta acción no se puede deshacer."}
        </p>
      </ConfirmDialog>
    </div>
  );
}
