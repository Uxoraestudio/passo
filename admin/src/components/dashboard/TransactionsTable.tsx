"use client";

import { useMemo, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { transactionRows, type TransactionStatus } from "@/lib/sales-data";
import styles from "./TransactionsTable.module.css";

const statusToneMap: Record<TransactionStatus, string> = {
  Aprobada: "teal",
  Procesando: "orange",
  Fallida: "danger",
  Reembolsada: "neutral",
};

export default function TransactionsTable() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return transactionRows;
    return transactionRows.filter(
      (row) =>
        row.orderId.toLowerCase().includes(term) ||
        row.customerName.toLowerCase().includes(term) ||
        row.customerContact.toLowerCase().includes(term)
    );
  }, [query]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Registro de Transacciones Recientes</h2>
          <p className={styles.subtitle}>Auditoría completa de órdenes emitidas, clientes y estados de cobro</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchWrap}>
            <MaterialIcon name="search" className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Filtrar por orden o RUT..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button type="button" className={styles.filterButton}>
            <MaterialIcon name="filter_list" className={styles.filterIcon} />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Orden</th>
              <th>Fecha &amp; Hora</th>
              <th>Cliente</th>
              <th>Evento</th>
              <th>Entradas</th>
              <th>Total CLP</th>
              <th>Método Pago</th>
              <th>Estado</th>
              <th className={styles.actionsHead}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td className={styles.orderId}>{row.orderId}</td>
                <td>
                  <span className={styles.dateLabel}>{row.dateLabel}</span>
                  <span className={styles.relativeLabel}>{row.relativeLabel}</span>
                </td>
                <td>
                  <div className={styles.customerCell}>
                    <span className={styles.avatar} data-danger={row.status === "Fallida"}>
                      {row.customerInitials}
                    </span>
                    <div>
                      <span className={styles.customerName}>{row.customerName}</span>
                      <span className={styles.customerContact}>{row.customerContact}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={styles.eventName}>{row.eventName}</span>
                  <span className={styles.eventVenue}>{row.eventVenue}</span>
                </td>
                <td>
                  <span className={styles.itemsLabel}>{row.itemsLabel}</span>
                  <span className={styles.itemsCaption}>{row.itemsCaption}</span>
                </td>
                <td>
                  <span className={styles.total} data-tone={row.totalTone}>
                    {row.total}
                  </span>
                </td>
                <td>
                  <div className={styles.paymentCell}>
                    <MaterialIcon name={row.paymentIcon} className={styles.paymentIcon} />
                    <span>{row.paymentLabel}</span>
                  </div>
                </td>
                <td>
                  <span className={styles.statusPill} data-tone={statusToneMap[row.status]}>
                    <span className={styles.statusDot} data-tone={statusToneMap[row.status]} />
                    {row.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" className={styles.actionButton} title="Ver comprobante">
                      <MaterialIcon name="receipt" className={styles.actionIcon} />
                    </button>
                    <button type="button" className={styles.actionButton} title="Reenviar e-ticket QR">
                      <MaterialIcon name="send" className={styles.actionIcon} />
                    </button>
                    <button type="button" className={styles.actionButton} data-danger title="Gestionar reembolso">
                      <MaterialIcon name="replay" className={styles.actionIcon} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
                  No se encontraron transacciones para &quot;{query}&quot;.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerText}>
          Mostrando <strong>1 - {filteredRows.length}</strong> de <strong>3.842</strong> transacciones
        </span>
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageButton}
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <MaterialIcon name="chevron_left" className={styles.pageIcon} />
          </button>
          {[1, 2, 3].map((n) => (
            <button key={n} type="button" className={styles.pageButton} data-active={page === n} onClick={() => setPage(n)}>
              {n}
            </button>
          ))}
          <span className={styles.pageEllipsis}>...</span>
          <button type="button" className={styles.pageButton} data-active={page === 76} onClick={() => setPage(76)}>
            76
          </button>
          <button type="button" className={styles.pageButton} onClick={() => setPage((p) => p + 1)}>
            <MaterialIcon name="chevron_right" className={styles.pageIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
