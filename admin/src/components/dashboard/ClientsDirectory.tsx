"use client";

import { useMemo, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { clients, segmentOptions, eventOptions, type Client, type ClientBadge } from "@/lib/clients-data";
import styles from "./ClientsDirectory.module.css";

const badgeIconMap: Record<ClientBadge, string> = {
  "VIP Fan": "local_fire_department",
  Frecuente: "replay",
  Preventista: "alarm_on",
  Nuevo: "fiber_new",
};

const badgeToneMap: Record<ClientBadge, string> = {
  "VIP Fan": "orange",
  Frecuente: "neutral",
  Preventista: "purple",
  Nuevo: "muted",
};

export default function ClientsDirectory() {
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("all");
  const [eventKey, setEventKey] = useState("all");
  const [selectedId, setSelectedId] = useState<string>(clients[0].id);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesSearch = !term || client.name.toLowerCase().includes(term) || client.rut.toLowerCase().includes(term);
      const matchesSegment = segment === "all" || client.segment === segment;
      const matchesEvent = eventKey === "all" || client.eventKey === eventKey;
      return matchesSearch && matchesSegment && matchesEvent;
    });
  }, [search, segment, eventKey]);

  const selectedClient: Client = clients.find((c) => c.id === selectedId) ?? clients[0];

  const clearFilters = () => {
    setSearch("");
    setSegment("all");
    setEventKey("all");
  };

  return (
    <div className={styles.layout}>
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.searchWrap}>
            <MaterialIcon name="search" className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por Nombre, RUT (ej: 17.842.119-4), Correo o Teléfono..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.filterControls}>
            <span className={styles.selectWrap}>
              <MaterialIcon name="label" className={styles.selectIcon} />
              <select className={styles.select} value={segment} onChange={(event) => setSegment(event.target.value)}>
                {segmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </span>
            <span className={styles.selectWrap}>
              <MaterialIcon name="celebration" className={styles.selectIcon} />
              <select className={styles.select} value={eventKey} onChange={(event) => setEventKey(event.target.value)}>
                {eventOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </span>
            <button type="button" className={styles.clearButton} onClick={clearFilters}>
              <MaterialIcon name="filter_alt_off" className={styles.clearIcon} />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.tableCol}>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderLeft}>
                <span className={styles.tableTitle}>Base de Compradores</span>
                <span className={styles.countPill}>{filteredClients.length} mostrados</span>
              </div>
              <div className={styles.syncNote}>
                <span className={styles.syncDot} />
                Sincronizado con pasarela Webpay y MercadoPago
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Segmento</th>
                    <th>Compras / Tickets</th>
                    <th>Gasto Total</th>
                    <th>Último Evento</th>
                    <th>Estado</th>
                    <th className={styles.actionsHead}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className={styles.row} data-selected={client.id === selectedId} onClick={() => setSelectedId(client.id)}>
                      <td>
                        <div className={styles.clientCell}>
                          <span className={styles.avatar}>
                            {client.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={client.avatar} alt="" className={styles.avatarImg} />
                            ) : (
                              client.initials
                            )}
                          </span>
                          <div>
                            <span className={styles.clientName}>
                              {client.name}
                              {client.verified ? <MaterialIcon name="verified" className={styles.verifiedIcon} /> : null}
                            </span>
                            <span className={styles.clientContact}>
                              RUT {client.rut} • {client.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.segmentPill} data-tone={badgeToneMap[client.badge]}>
                          <MaterialIcon name={badgeIconMap[client.badge]} className={styles.segmentIcon} />
                          {client.badge}
                        </span>
                      </td>
                      <td>
                        <span className={styles.ordersLabel}>{client.orders}</span>
                        <span className={styles.ticketsLabel}>{client.tickets}</span>
                      </td>
                      <td>
                        <span className={styles.spendLabel}>{client.totalSpent}</span>
                        <span className={styles.spendCurrency}>CLP</span>
                      </td>
                      <td>
                        <span className={styles.lastEvent} data-emphasis={client.lastEventEmphasis}>
                          {client.lastEvent}
                        </span>
                        <span className={styles.lastEventDetail}>{client.lastEventDetail}</span>
                      </td>
                      <td>
                        <span className={styles.statusPill} data-tone={client.status === "Activo" ? "success" : "info"}>
                          {client.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button type="button" className={styles.actionButton} title="Ver Ficha Completa" onClick={(event) => event.stopPropagation()}>
                            <MaterialIcon name="badge" className={styles.actionIcon} />
                          </button>
                          <button type="button" className={styles.actionButton} title="Historial de Tickets" onClick={(event) => event.stopPropagation()}>
                            <MaterialIcon name="confirmation_number" className={styles.actionIcon} />
                          </button>
                          <button type="button" className={styles.actionButton} data-accent title="Enviar Mensaje o Cortesía" onClick={(event) => event.stopPropagation()}>
                            <MaterialIcon name="forward_to_inbox" className={styles.actionIcon} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyState}>
                        No se encontraron clientes para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <span className={styles.footerText}>Mostrando 1 a {filteredClients.length} de 38.450 compradores registrados</span>
              <div className={styles.pagination}>
                <button type="button" className={styles.pageButton} disabled>
                  <MaterialIcon name="chevron_left" className={styles.pageIcon} />
                </button>
                <span className={styles.pageActive}>1</span>
                <button type="button" className={styles.pageButton}>
                  2
                </button>
                <button type="button" className={styles.pageButton}>
                  3
                </button>
                <span className={styles.pageEllipsis}>…</span>
                <button type="button" className={styles.pageButton}>
                  64
                </button>
                <button type="button" className={styles.pageButton}>
                  <MaterialIcon name="chevron_right" className={styles.pageIcon} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.drawerCol}>
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerIdentity}>
                <span className={styles.drawerAvatar}>
                  {selectedClient.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedClient.avatar} alt="" className={styles.drawerAvatarImg} />
                  ) : (
                    selectedClient.initials
                  )}
                  <span className={styles.verifiedDot} />
                </span>
                <div>
                  <h2 className={styles.drawerName}>{selectedClient.name}</h2>
                  <p className={styles.drawerRut}>
                    RUT {selectedClient.rut} • {selectedClient.location}
                  </p>
                  <div className={styles.drawerBadgeRow}>
                    <span className={styles.segmentPill} data-tone={badgeToneMap[selectedClient.badge]}>
                      <MaterialIcon name={badgeIconMap[selectedClient.badge]} className={styles.segmentIcon} />
                      {selectedClient.badge}
                    </span>
                    <span className={styles.scoreText}>Score: {selectedClient.score}/100</span>
                  </div>
                </div>
              </div>
              <button type="button" className={styles.moreButton} title="Opciones avanzadas">
                <MaterialIcon name="more_vert" className={styles.moreIcon} />
              </button>
            </div>

            <div className={styles.statsGrid}>
              <div>
                <span className={styles.statLabel}>Inversión Total</span>
                <span className={styles.statValue}>
                  {selectedClient.totalSpent} <span className={styles.statUnit}>CLP</span>
                </span>
                <span className={styles.statNote}>Top 2% de compradores</span>
              </div>
              <div>
                <span className={styles.statLabel}>Entradas Totales</span>
                <span className={styles.statValue}>
                  {selectedClient.tickets.split(" ")[0]} <span className={styles.statUnit}>tickets</span>
                </span>
                <span className={styles.statNoteMuted}>{selectedClient.orders}</span>
              </div>
            </div>

            <div>
              <h3 className={styles.sectionTitle}>
                <span>Hitos y Comportamiento</span>
                <span className={styles.sectionCaption}>Métricas de asistencia</span>
              </h3>
              <div className={styles.behaviorList}>
                <div className={styles.behaviorRow}>
                  <span className={styles.behaviorLabel}>
                    <MaterialIcon name="speed" className={styles.behaviorIcon} />
                    Tiempo de compra típico
                  </span>
                  <span className={styles.behaviorValue}>Primeros 4 minutos</span>
                </div>
                <div className={styles.behaviorRow}>
                  <span className={styles.behaviorLabel}>
                    <MaterialIcon name="credit_card" className={styles.behaviorIcon} />
                    Método preferido
                  </span>
                  <span className={styles.behaviorValue}>Crédito Banco Santander</span>
                </div>
                <div className={styles.behaviorRow}>
                  <span className={styles.behaviorLabel}>
                    <MaterialIcon name="schedule" className={styles.behaviorIcon} />
                    Ingreso promedio al recinto
                  </span>
                  <span className={styles.behaviorValue}>45 min antes de show</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className={styles.sectionTitle}>
                <span>Eventos Asistidos</span>
              </h3>
              <div className={styles.eventsList}>
                {selectedClient.events.map((event) => (
                  <div key={event.name} className={styles.eventRow}>
                    <div className={styles.eventLeft}>
                      <span className={styles.eventDot} style={{ background: event.color }} />
                      <div>
                        <span className={styles.eventName}>{event.name}</span>
                        <span className={styles.eventDetail}>{event.detail}</span>
                      </div>
                    </div>
                    <span className={styles.eventPrice}>{event.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className={styles.notesHeader}>
                <label className={styles.notesLabel} htmlFor="organizer-notes">
                  <MaterialIcon name="edit_note" className={styles.notesIcon} />
                  Notas del Productor / Concierge
                </label>
                <span className={styles.notesPrivate}>Privado</span>
              </div>
              <textarea id="organizer-notes" className={styles.notesTextarea} rows={3} defaultValue={selectedClient.notes} key={selectedClient.id} />
            </div>

            <div className={styles.drawerActions}>
              <button type="button" className={styles.courtesyButton}>
                <MaterialIcon name="card_giftcard" className={styles.drawerActionIcon} />
                <span>Enviar Cortesía</span>
              </button>
              <button type="button" className={styles.contactButton}>
                <MaterialIcon name="mail" className={styles.drawerActionIcon} />
                <span>Contactar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
