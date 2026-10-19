"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/icons";
import { EVENTS_FLASH_KEY, EventHasSalesError, deleteEvent, listEvents, type EventRecord, type EventStatus } from "@/lib/events-data";
import { fetchRevenueByEvent } from "@/lib/admin-data";
import { useCanEdit } from "@/lib/access";
import EventsKpiRow from "./EventsKpiRow";
import EventsFilterBar, { type FilterTab } from "./EventsFilterBar";
import EventRow from "./EventRow";
import ConfirmDialog from "./ConfirmDialog";
import formStyles from "./EventFormPage.module.css";
import styles from "./EventsContent.module.css";

const PAGE_SIZE = 5;

const statusesByTab: Record<Exclude<FilterTab, "todos">, EventStatus[]> = {
  activos: ["en-venta", "casi-agotado"],
  borradores: ["borrador"],
  finalizados: ["finalizado"],
};

export default function EventsContent() {
  const router = useRouter();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revenueByEvent, setRevenueByEvent] = useState<Record<string, number> | null>(null);
  const canEdit = useCanEdit("eventos");

  const [tab, setTab] = useState<FilterTab>("todos");
  const [venue, setVenue] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [reloadToken, setReloadToken] = useState(0);
  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  const [flash, setFlash] = useState("");

  // Delete flow: a plain confirmation, or (with paid orders) typing the title.
  const [toDelete, setToDelete] = useState<{ event: EventRecord; paidOrders: number | null } | null>(null);
  const [typedTitle, setTypedTitle] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let message: string | null = null;
    try {
      message = sessionStorage.getItem(EVENTS_FLASH_KEY);
    } catch {
      return;
    }
    if (!message) return;
    const show = window.setTimeout(() => {
      sessionStorage.removeItem(EVENTS_FLASH_KEY);
      setFlash(message ?? "");
    }, 0);
    const hide = window.setTimeout(() => setFlash(""), 4200);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [data, revenue] = await Promise.all([listEvents(), fetchRevenueByEvent()]);
        if (active) {
          setEvents(data);
          setRevenueByEvent(revenue);
        }
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

  const openEdit = (event: EventRecord) => {
    router.push(`/eventos/${event.id}/editar`);
  };

  const handleDelete = (event: EventRecord) => {
    setToDelete({ event, paidOrders: null });
    setTypedTitle("");
    setDeleteError("");
  };

  const closeDelete = () => {
    if (!deleting) setToDelete(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { event, paidOrders } = toDelete;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteEvent(event.id, paidOrders ? typedTitle : undefined);
      setToDelete(null);
      setFlash(`Evento «${event.title}» eliminado`);
      window.setTimeout(() => setFlash(""), 4200);
      refresh();
    } catch (e) {
      if (e instanceof EventHasSalesError) {
        // First attempt found sales: ask for the title (or the typed one didn't match).
        if (paidOrders) setDeleteError("El nombre no coincide. Escríbelo tal como aparece.");
        setToDelete({ event, paidOrders: e.paidOrders });
      } else {
        setDeleteError(e instanceof Error ? e.message : "No pudimos eliminar el evento.");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.toast} role="status" aria-live="polite" data-show={!!flash}>
        {flash && (
          <>
            <MaterialIcon decorative name="check_circle" className={styles.toastIcon} />
            {flash}
          </>
        )}
      </div>
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
          {canEdit && (
            <button type="button" className={styles.createButton} onClick={() => router.push("/eventos/nuevo")}>
              <MaterialIcon name="add_circle" className={styles.createIcon} />
              <span>Nuevo evento</span>
            </button>
          )}
        </div>
      </div>

      <EventsKpiRow events={events} revenue={revenueByEvent ? Object.values(revenueByEvent).reduce((a, b) => a + b, 0) : null} />

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
          pageItems.map((event) => (
            <EventRow key={event.id} event={event} revenue={revenueByEvent ? (revenueByEvent[event.id] ?? 0) : null} onEdit={openEdit} onDelete={handleDelete} />
          ))
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
      <ConfirmDialog
        open={toDelete !== null}
        icon="delete"
        kind={toDelete?.paidOrders ? "form" : "alert"}
        title={toDelete?.paidOrders ? "Este evento tiene ventas" : `¿Eliminar «${toDelete?.event.title ?? ""}»?`}
        busy={deleting}
        onClose={closeDelete}
        actions={[
          { label: "Cancelar", variant: "soft", onClick: closeDelete, autoFocus: !toDelete?.paidOrders },
          {
            label: "Eliminar evento",
            variant: "danger",
            onClick: confirmDelete,
            busyLabel: "Eliminando…",
          },
        ]}
      >
        {toDelete?.paidOrders ? (
          <>
            <p>
              «{toDelete.event.title}» tiene <b>{toDelete.paidOrders.toLocaleString("es-CL")}</b>{" "}
              {toDelete.paidOrders === 1 ? "compra pagada" : "compras pagadas"} (ventas o cortesías). Si lo eliminas se borran también
              sus órdenes, entradas y validaciones, y no se puede deshacer.
            </p>
            <label className={formStyles.field} style={{ marginTop: 12 }}>
              <span className={formStyles.label}>Para confirmar, escribe el nombre del evento</span>
              <input
                value={typedTitle}
                onChange={(e) => setTypedTitle(e.target.value)}
                placeholder={toDelete.event.title}
                autoComplete="off"
                data-autofocus=""
                onKeyDown={(e) => e.key === "Enter" && typedTitle.trim() && confirmDelete()}
              />
            </label>
          </>
        ) : (
          <p>Se eliminará el evento con sus sectores, preventas y cupones. Esta acción no se puede deshacer.</p>
        )}
        {deleteError && (
          <p className={formStyles.fieldError} role="alert">
            {deleteError}
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
