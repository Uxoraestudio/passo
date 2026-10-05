"use client";

import { useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { clp, downloadCsv, fetchClients, formatDate, int, type ClientRow } from "@/lib/admin-data";
import KpiCard, { type KpiDatum } from "./KpiCard";
import pageStyles from "@/app/inicio/page.module.css";
import tableStyles from "./SalesContent.module.css";
import styles from "./ClientsContent.module.css";

type Sort = "recientes" | "gasto" | "compras";
const PAGE = 25;
const DAY = 86_400_000;

export default function ClientsContent() {
  const [clients, setClients] = useState<ClientRow[] | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("recientes");
  const [buyersOnly, setBuyersOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    let active = true;
    fetchClients()
      .then((rows) => {
        if (!active) return;
        setClients(rows);
        setLoadedAt(Date.now());
        setError("");
      })
      .catch(() => active && setError("No pudimos cargar los clientes. Revisa tu conexión e inténtalo de nuevo."));
    return () => {
      active = false;
    };
  }, [reload]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = (clients ?? []).filter(
      (c) => (!buyersOnly || c.orders_paid > 0) && (!q || c.email.toLowerCase().includes(q) || (c.full_name ?? "").toLowerCase().includes(q))
    );
    const by: Record<Sort, (a: ClientRow, b: ClientRow) => number> = {
      recientes: (a, b) => b.created_at.localeCompare(a.created_at),
      gasto: (a, b) => b.total_spent - a.total_spent,
      compras: (a, b) => b.orders_paid - a.orders_paid,
    };
    return rows.sort(by[sort]);
  }, [clients, search, sort, buyersOnly]);

  const kpis: KpiDatum[] = useMemo(() => {
    if (!clients) return [];
    const now = loadedAt;
    const recent = clients.filter((c) => now - new Date(c.created_at).getTime() <= 30 * DAY).length;
    const previous = clients.filter((c) => {
      const age = now - new Date(c.created_at).getTime();
      return age > 30 * DAY && age <= 60 * DAY;
    }).length;
    const buyers = clients.filter((c) => c.orders_paid > 0).length;
    const repeat = clients.filter((c) => c.orders_paid > 1).length;
    const pct = (n: number) => (clients.length > 0 ? `${Math.round((n / clients.length) * 100)}% de los registrados` : "Sin registros");
    return [
      { id: "total", label: "Clientes registrados", value: int(clients.length), delta: null, caption: "Cuentas de compradores", iconBg: "purple", icon: "calendar" },
      {
        id: "nuevos",
        label: "Nuevos (30 días)",
        value: int(recent),
        delta: previous > 0 ? `${recent >= previous ? "+" : "−"}${Math.abs(Math.round(((recent - previous) / previous) * 100))}%` : recent > 0 ? "Nuevo" : null,
        caption: "vs. 30 días anteriores",
        iconBg: "orange",
        icon: "bars",
      },
      { id: "compradores", label: "Con al menos una compra", value: int(buyers), delta: null, caption: pct(buyers), iconBg: "purple", icon: "ticket" },
      { id: "recurrentes", label: "Compradores recurrentes", value: int(repeat), delta: null, caption: "2 o más compras", iconBg: "orange", icon: "pie" },
    ];
  }, [clients, loadedAt]);

  const exportCsv = () =>
    downloadCsv(`clientes-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Nombre", "Correo", "Registro", "Órdenes pagadas", "Entradas", "Total gastado", "Última compra"],
      ...filtered.map((c) => [c.full_name ?? "", c.email, formatDate(c.created_at), c.orders_paid, c.tickets, c.total_spent, c.last_purchase_at ? formatDate(c.last_purchase_at) : ""]),
    ]);

  return (
    <main className={pageStyles.main}>
      <div className={pageStyles.heroRow}>
        <div>
          <h1 className={pageStyles.pageTitle}>Clientes</h1>
          <p className={pageStyles.pageSubtitle}>Personas registradas en Passo y su historial de compras.</p>
        </div>
        <div className={pageStyles.heroActions}>
          <button type="button" className={tableStyles.exportButton} onClick={exportCsv} disabled={!clients || filtered.length === 0}>
            <MaterialIcon decorative name="download" />
            Exportar CSV
          </button>
        </div>
      </div>

      {error ? (
        <div className={pageStyles.stateCard} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setReload((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      ) : !clients ? (
        <div className={pageStyles.stateCard} aria-busy="true">
          <p>Cargando clientes…</p>
        </div>
      ) : (
        <>
          <div className={pageStyles.kpiGrid}>
            {kpis.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>

          <section className={tableStyles.card} aria-labelledby="directorio">
            <div className={tableStyles.tableHeader}>
              <div>
                <h3 id="directorio" className={tableStyles.cardTitle}>
                  Directorio
                </h3>
                <p className={tableStyles.cardSubtitle}>
                  {filtered.length === clients.length ? `${int(clients.length)} clientes` : `${int(filtered.length)} de ${int(clients.length)} clientes`}
                </p>
              </div>
              <div className={styles.controls}>
                <label className={styles.search}>
                  <MaterialIcon decorative name="search" />
                  <span className="sr-only">Buscar cliente</span>
                  <input
                    type="search"
                    placeholder="Buscar por nombre o correo"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setVisible(PAGE);
                    }}
                  />
                </label>
                <label className={tableStyles.eventSelect}>
                  <span className="sr-only">Ordenar</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                    <option value="recientes">Registro más reciente</option>
                    <option value="gasto">Mayor gasto</option>
                    <option value="compras">Más compras</option>
                  </select>
                </label>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={buyersOnly} onChange={(e) => setBuyersOnly(e.target.checked)} />
                  Solo compradores
                </label>
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className={tableStyles.empty}>{clients.length === 0 ? "Aún no hay clientes registrados." : "Ningún cliente coincide con la búsqueda."}</p>
            ) : (
              <>
                <div className={tableStyles.tableWrap}>
                  <table className={tableStyles.table}>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Registro</th>
                        <th className={tableStyles.num}>Compras</th>
                        <th className={tableStyles.num}>Entradas</th>
                        <th className={tableStyles.num}>Total gastado</th>
                        <th>Última compra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, visible).map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className={styles.person}>
                              <span className={styles.avatar} aria-hidden="true">
                                {(c.full_name || c.email).trim().charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <span className={tableStyles.buyer}>{c.full_name || "Sin nombre"}</span>
                                <span className={tableStyles.sub}>{c.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>{formatDate(c.created_at)}</td>
                          <td className={tableStyles.num}>{int(c.orders_paid)}</td>
                          <td className={tableStyles.num}>{int(c.tickets)}</td>
                          <td className={tableStyles.num}>{c.total_spent > 0 ? clp(c.total_spent) : "—"}</td>
                          <td>{c.last_purchase_at ? formatDate(c.last_purchase_at) : <span className={tableStyles.sub}>Sin compras</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filtered.length > visible && (
                  <button type="button" className={styles.more} onClick={() => setVisible((n) => n + PAGE)}>
                    Ver {Math.min(PAGE, filtered.length - visible)} más
                  </button>
                )}
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
