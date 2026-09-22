"use client";

import { useMemo, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { managedEvents, type EventStatus } from "@/lib/events-management-data";
import EventsKpiRow from "./EventsKpiRow";
import EventsFilterBar, { type FilterTab } from "./EventsFilterBar";
import EventRow from "./EventRow";
import styles from "./EventsContent.module.css";

const PAGE_SIZE = 5;

const statusesByTab: Record<Exclude<FilterTab, "todos">, EventStatus[]> = {
  activos: ["en-venta", "casi-agotado"],
  borradores: ["borrador"],
  finalizados: ["finalizado"],
};

export default function EventsContent() {
  const [tab, setTab] = useState<FilterTab>("todos");
  const [venue, setVenue] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      todos: managedEvents.length,
      activos: managedEvents.filter((e) => statusesByTab.activos.includes(e.status)).length,
      borradores: managedEvents.filter((e) => statusesByTab.borradores.includes(e.status)).length,
      finalizados: managedEvents.filter((e) => statusesByTab.finalizados.includes(e.status)).length,
    }),
    []
  );

  const filtered = useMemo(() => {
    return managedEvents.filter((event) => {
      if (tab !== "todos" && !statusesByTab[tab].includes(event.status)) return false;
      if (venue && event.venue !== venue) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!event.title.toLowerCase().includes(q) && !event.venue.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tab, venue, search]);

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
          <button type="button" className={styles.createButton}>
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
      />

      <div className={styles.list}>
        {pageItems.length > 0 ? (
          pageItems.map((event) => <EventRow key={event.id} event={event} />)
        ) : (
          <div className={styles.empty}>No se encontraron eventos con estos filtros.</div>
        )}
      </div>

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
    </div>
  );
}
