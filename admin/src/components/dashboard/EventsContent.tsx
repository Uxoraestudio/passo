"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { createEvent, deleteEvent, listEvents, updateEvent, type EventInput, type EventRecord, type EventStatus } from "@/lib/events-data";
import EventsKpiRow from "./EventsKpiRow";
import EventsFilterBar, { type FilterTab } from "./EventsFilterBar";
import EventRow from "./EventRow";
import EventFormDrawer from "./EventFormDrawer";
import styles from "./EventsContent.module.css";

const PAGE_SIZE = 5;

const statusesByTab: Record<Exclude<FilterTab, "todos">, EventStatus[]> = {
  activos: ["en-venta", "casi-agotado"],
  borradores: ["borrador"],
  finalizados: ["finalizado"],
};

export default function EventsContent() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [tab, setTab] = useState<FilterTab>("todos");
  const [venue, setVenue] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [reloadToken, setReloadToken] = useState(0);
  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await listEvents();
        if (active) setEvents(data);
      } catch {
        if (active) setLoadError("No pudimos cargar los eventos. Intenta recargar la página.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const venues = useMemo(() => Array.from(new Set(events.map((e) => e.venue))).sort(), [events]);

  const counts = useMemo(
    () => ({
      todos: events.length,
      activos: events.filter((e) => statusesByTab.activos.includes(e.status)).length,
      borradores: events.filter((e) => statusesByTab.borradores.includes(e.status)).length,
      finalizados: events.filter((e) => statusesByTab.finalizados.includes(e.status)).length,
    }),
    [events]
  );

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (tab !== "todos" && !statusesByTab[tab].includes(event.status)) return false;
      if (venue && event.venue !== venue) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!event.title.toLowerCase().includes(q) && !event.venue.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [events, tab, venue, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updateTab = (next: FilterTab) => {
    setTab(next);
    setPage(1);
  };

  const updateVenue = (next: string) => {
    setVenue(next);
    setPage(1);
  };

  const updateSearch = (next: string) => {
    setSearch(next);
    setPage(1);
  };

  const openCreate = () => {
    setEditingEvent(null);
    setFormError("");
    setDrawerOpen(true);
  };

  const openEdit = (event: EventRecord) => {
    setEditingEvent(event);
    setFormError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
  };

  const handleSubmit = async (input: EventInput) => {
    setSaving(true);
    setFormError("");
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, input);
      } else {
        await createEvent(input);
      }
      setDrawerOpen(false);
      refresh();
    } catch {
      setFormError("No pudimos guardar el evento. Revisa los datos e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: EventRecord) => {
    if (!window.confirm(`¿Eliminar "${event.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteEvent(event.id);
      refresh();
    } catch {
      window.alert("No pudimos eliminar el evento. Intenta de nuevo.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.eyebrow}>
            <span>AFORIQ Live Operations</span>
            <span>•</span>
            <span className={styles.eyebrowAccent}>Temporada 2025/2026</span>
          </div>
          <h1 className={styles.title}>Gestión de Eventos</h1>
          <p className={styles.subtitle}>
            Administra la programación, estado, aforo y recaudación de tus eventos en tiempo real.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.exportGroup}>
            <button type="button" className={styles.exportButton}>
              <MaterialIcon name="table_chart" className={styles.exportIcon} />
              <span>Excel</span>
            </button>
            <button type="button" className={styles.exportButton}>
              <MaterialIcon name="picture_as_pdf" className={styles.exportIcon} />
              <span>PDF</span>
            </button>
          </div>
          <button type="button" className={styles.createButton} onClick={openCreate}>
            <MaterialIcon name="add_circle" className={styles.createIcon} />
            <span>Nuevo evento</span>
          </button>
        </div>
      </div>

      <EventsKpiRow />

      <EventsFilterBar
        tab={tab}
        onTabChange={updateTab}
        counts={counts}
        venue={venue}
        onVenueChange={updateVenue}
        search={search}
        onSearchChange={updateSearch}
        venues={venues}
      />

      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>Cargando eventos...</div>
        ) : loadError ? (
          <div className={styles.empty}>{loadError}</div>
        ) : pageItems.length > 0 ? (
          pageItems.map((event) => <EventRow key={event.id} event={event} onEdit={openEdit} onDelete={handleDelete} />)
        ) : (
          <div className={styles.empty}>
            {events.length === 0 ? "Aún no tienes eventos. Crea el primero." : "No se encontraron eventos con estos filtros."}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            <span>
              Mostrando <strong>{filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</strong> -{" "}
              <strong>{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong> de{" "}
              <strong>{filtered.length}</strong> eventos
            </span>
            <span>•</span>
            <span>
              Página {currentPage} de {totalPages}
            </span>
          </div>
          <div className={styles.paginationButtons}>
            <button
              type="button"
              className={styles.pageArrow}
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              <MaterialIcon name="chevron_left" className={styles.pageArrowIcon} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={styles.pageNumber}
                data-active={p === currentPage}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageArrow}
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Página siguiente"
            >
              <MaterialIcon name="chevron_right" className={styles.pageArrowIcon} />
            </button>
          </div>
        </div>
      )}

      {drawerOpen && (
        <EventFormDrawer
          key={editingEvent?.id ?? "new"}
          event={editingEvent}
          saving={saving}
          error={formError}
          onClose={closeDrawer}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
