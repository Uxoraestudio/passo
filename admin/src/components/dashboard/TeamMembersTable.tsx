"use client";

import { useMemo, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { teamMembers } from "@/lib/roles-data";
import styles from "./TeamMembersTable.module.css";

export default function TeamMembersTable() {
  const [search, setSearch] = useState("");
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(teamMembers.map((member) => [member.id, member.active]))
  );

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return teamMembers;
    return teamMembers.filter((member) => member.name.toLowerCase().includes(term) || member.email.toLowerCase().includes(term));
  }, [search]);

  const toggleActive = (id: string) => {
    setActiveStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Miembros del Equipo</h2>
          <span className={styles.countPill}>16 Registrados</span>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchWrap}>
            <MaterialIcon name="search" className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Filtrar por nombre o email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button type="button" className={styles.filtersButton}>
            <MaterialIcon name="filter_list" className={styles.filtersIcon} />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol Asignado</th>
              <th>Eventos Asignados</th>
              <th>Última Conexión</th>
              <th>Estado</th>
              <th className={styles.actionsHead}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className={styles.userCell}>
                    <span className={styles.avatar} data-tone={member.avatarTone}>
                      {member.avatarInitials}
                    </span>
                    <div>
                      <span className={styles.userName}>{member.name}</span>
                      <span className={styles.userEmail}>{member.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={styles.rolePill} data-tone={member.roleTone}>
                    {member.roleLabel}
                  </span>
                </td>
                <td>
                  <span className={styles.eventsLabel}>{member.eventsAssigned}</span>
                  {member.eventsCaption ? <span className={styles.eventsCaption}>{member.eventsCaption}</span> : null}
                </td>
                <td>
                  <span className={styles.connectionLabel}>{member.lastConnection}</span>
                  <span className={styles.connectionDetail}>{member.connectionDetail}</span>
                </td>
                <td>
                  {member.status === "Active" ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={activeStates[member.id]}
                      aria-label={`Estado de ${member.name}`}
                      className={styles.switch}
                      data-checked={activeStates[member.id]}
                      onClick={() => toggleActive(member.id)}
                    >
                      <span className={styles.switchThumb} />
                    </button>
                  ) : (
                    <span className={styles.pendingPill}>Pendiente</span>
                  )}
                </td>
                <td>
                  {member.status === "Pendiente" ? (
                    <div className={styles.actions}>
                      <button type="button" className={styles.resendButton}>
                        Reenviar
                      </button>
                      <button type="button" className={styles.actionButton} data-danger title="Cancelar invitación">
                        <MaterialIcon name="close" className={styles.actionIcon} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <button type="button" className={styles.actionButton} title="Editar permisos">
                        <MaterialIcon name="tune" className={styles.actionIcon} />
                      </button>
                      <button type="button" className={styles.actionButton} title="Reasignar rol">
                        <MaterialIcon name="sync_alt" className={styles.actionIcon} />
                      </button>
                      <button type="button" className={styles.actionButton} data-danger title="Revocar acceso">
                        <MaterialIcon name="block" className={styles.actionIcon} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No se encontraron miembros para &quot;{search}&quot;.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerText}>Mostrando {filteredMembers.length} de 16 operadores con credenciales activas</span>
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
          <button type="button" className={styles.nextButton}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
